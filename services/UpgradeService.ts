import { ISelectedUnit, IUpgrade, IUpgradeGainsItem, IUpgradeOption } from "../data/interfaces";
import EquipmentService from "./EquipmentService";
import "../extensions";
import DataParsingService from "./DataParsingService";
import RulesService from "./RulesService";
import { current } from "immer";

export default class UpgradeService {
  static calculateListTotal(list: ISelectedUnit[]) {
    return list
      .reduce((value, current) => value + UpgradeService.calculateUnitTotal(current), 0);
  }

  static calculateUnitTotal(unit: ISelectedUnit) {
    let cost = unit.cost * (unit.combined ? 2 : 1);

    for (const upgrade of unit.selectedUpgrades) {
      if (upgrade.cost)
        cost += parseInt(upgrade.cost);
    }
    return cost;
  }

  public static isApplied(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption): boolean {

    return unit.selectedUpgrades.contains(u => u.id === option.id);
  }

  public static countApplied(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption): number {
    return unit.selectedUpgrades.filter(u => u.id === option.id).length;
  }

  public static findToReplace(unit: ISelectedUnit, what: string) {
    // Try and find item to replace...
    var toReplace = EquipmentService.findLast(unit.equipment, what) as { count?: number };

    // Couldn't find the item to replace or there are none left
    if (!toReplace || toReplace.count <= 0) {

      // Try and find an upgrade instead
      for (let i = unit.selectedUpgrades.length - 1; i >= 0; i--) {
        const upgrade = unit.selectedUpgrades[i];
        toReplace = upgrade
          .gains
          .filter(e => EquipmentService.compareEquipmentNames(e.name, what))[0] as { count?: number };

        if (toReplace)
          break;
      }
    }

    return toReplace;
  }

  public static isValid(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption): boolean {

    const controlType = this.getControlType(unit, upgrade);
    const alreadySelected = this.countApplied(unit, upgrade, option);
    const appliedInGroup = upgrade.options.reduce((total, next) => total + this.countApplied(unit, upgrade, next), 0);

    // if it's a radio, it's valid if any other upgrade in the group is already applied
    if (controlType === "radio")
      if (appliedInGroup > 0)
        return true;

    if (upgrade.type === "replace") {

      // TODO: Will we need this here? Replacing more than 1 at a time perhaps...
      const replaceCount = typeof (upgrade.affects) === "number"
        ? upgrade.affects
        : upgrade.affects === "all"
          ? unit.size || 1 // All in unit
          : 1;

      //debugger;

      const replaceWhat: string[] = typeof (upgrade.replaceWhat) === "string"
        ? [upgrade.replaceWhat]
        : upgrade.replaceWhat;

      for (let what of replaceWhat) {

        var toRestore = null;

        // Try and find an upgrade instead
        for (let i = unit.selectedUpgrades.length - 1; i >= 0; i--) {
          const upgrade = unit.selectedUpgrades[i];
          toRestore = upgrade
            .gains
            .filter(e => EquipmentService.compareEquipmentNames(e.name, what))[0] as { count?: number };

          if (toRestore && toRestore.count)
            break;
        }

        // Couldn't find the upgrade to replace
        if (!toRestore || toRestore.count <= 0)
          toRestore = EquipmentService.findLast(unit.equipment, what);

        if (!toRestore)
          return false;

        // Nothing left to replace
        if (toRestore.count <= 0)
          return false;

        // May only select up to the limit
        if (typeof (upgrade.select) === "number") {
          if (appliedInGroup >= upgrade.select)
            return false;
        }
      }
    }

    // TODO: ...what is this doing?
    if (upgrade.type === "upgrade") {

      if (typeof (upgrade.select) === "number") {

        if (alreadySelected >= upgrade.select) {
          return false;
        }
      }
      else if (alreadySelected >= unit.size) {
        return false;
      }
    }

    return true;
  };

  public static getControlType(unit: ISelectedUnit, upgrade: IUpgrade): "check" | "radio" | "updown" {
    if (upgrade.type === "upgrade") {

      // "Upgrade any model with:"
      if (upgrade.affects === "any" && unit?.size > 1)
        return "updown";

      // "Upgrade with one:"
      if (upgrade.select === 1)
        return "radio";

      // Select > 1
      if (typeof (upgrade.select) === "number")
        return "updown";

      return "check";
    }

    // "Upgrade Psychic(1):"
    if (upgrade.type === "upgradeRule") {
      return "check";
    }

    if (upgrade.type === "replace") {

      // "Replace [weapon]:"
      if (!upgrade.affects) {
        if (typeof (upgrade.select) === "number")
          return "updown";
        return "radio";
      }
      // "Replace one [weapon]:"
      // "Replace all [weapons]:"
      if (upgrade.affects === 1 || upgrade.affects === "all") {
        return "radio";
      }
      // "Replace any [weapon]:"
      // "Replace 2 [weapons]:"
      if (upgrade.affects === "any" || typeof (upgrade.affects) === "number") {
        return "updown";
      }

    }

    console.error("No control type for: ", upgrade);

    return "updown";
  }

  public static apply(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption) {

    // How many of this upgrade do we need to apply
    const count = (typeof (upgrade.affects) === "number"
      ? upgrade.affects
      : upgrade.affects === "all"
        ? unit.size || 1 // All in unit
        : 1); // TODO: Add back multiple count weapons? * (option.count || 1);

    // Function to apply the upgrade option to the unit
    const apply = (available: number) => {
      const toApply = {
        ...option,
        gains: option.gains.map(g => ({
          ...g,
          count: Math.min(count, available) // e.g. If a unit of 5 has 4 CCWs left...
        }))
      };

      // Apply counts to item content
      for (let gain of toApply.gains) {
        if (gain.type !== "ArmyBookItem")
          continue;
        const item = gain as IUpgradeGainsItem;
        item.content = item.content.map(c => ({
          ...c,
          count: gain.count
        }));
      }

      unit.selectedUpgrades.push(toApply);
    };

    if (upgrade.type === "upgradeRule") {

      // TODO: Refactor this - shouldn't be using display name func to compare probably!
      const existingRuleIndex = unit
        .specialRules
        .findIndex(r => RulesService.displayName(r) === (upgrade.replaceWhat as string));

      // Remove existing rule
      if (existingRuleIndex > -1)
        unit.specialRules.splice(existingRuleIndex, 1);

      apply(count);

      // Add new rule(s)!
      //unit.specialRules = unit.specialRules.concat(option.gains as ISpecialRule[]);

      return;
    }
    else if (upgrade.type === "upgrade") {

      apply(count);
    }
    else if (upgrade.type === "replace") {

      console.log("Replace " + count);

      const replaceWhat: string[] = typeof (upgrade.replaceWhat) === "string"
        ? [upgrade.replaceWhat]
        : upgrade.replaceWhat;

      let available = 999;

      for (let what of replaceWhat) {

        // Try and find item to replace...
        var toReplace = this.findToReplace(unit, what);

        // Couldn't find the item to replace
        if (!toReplace) {
          console.error(`Cannot find ${upgrade.replaceWhat} to replace!`);
          return;
        }

        console.log("Replacing... ", current(toReplace));

        available = Math.min(available, toReplace.count);

        // Decrement the count of the item being replaced
        toReplace.count -= count;

        // TODO: Use Math.max... ?
        if (toReplace.count <= 0)
          toReplace.count = 0;

        console.log("Replaced... ", current(toReplace));
      }

      apply(available);
    }
  }

  public static remove(unit: ISelectedUnit, upgrade: IUpgrade, option: IUpgradeOption) {
    const removeAt = unit.selectedUpgrades.findLastIndex(u => u.id === option.id);
    const toRemove = unit.selectedUpgrades[removeAt];
    const count = toRemove.gains[0]?.count;
    unit.selectedUpgrades.splice(removeAt, 1);

    if (upgrade.type === "upgradeRule") {

      // Re-add original rule
      unit.specialRules.push(DataParsingService.parseRule(upgrade.replaceWhat as string));

      return;
    }

    if (upgrade.type === "replace") {

      const replaceWhat: string[] = typeof (upgrade.replaceWhat) === "string"
        ? [upgrade.replaceWhat]
        : upgrade.replaceWhat;

      // For each bit of equipment that was originally replaced
      for (let what of replaceWhat) {

        var toRestore = null;// EquipmentService.findLast(unit.equipment, what) as { count?: number };

        // Try and find an upgrade instead
        for (let i = unit.selectedUpgrades.length - 1; i >= 0; i--) {
          const upgrade = unit.selectedUpgrades[i];
          toRestore = upgrade
            .gains
            .filter(e => EquipmentService.compareEquipmentNames(e.name, what))[0] as { count?: number };

          if (toRestore)
            break;
        }

        // Couldn't find the upgrade to replace
        if (!toRestore)
          toRestore = EquipmentService.findLast(unit.equipment, what);

        if (!toRestore) {
          // Uh oh
          console.log("Could not restore " + what, current(unit));
          return;
        }

        // Increase the count by however much was replaced
        toRestore.count += count;
      }
    }
  }
}