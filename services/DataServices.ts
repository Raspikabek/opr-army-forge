import { nanoid } from "nanoid";
import { IUnit, IUpgradeOption } from "../data/interfaces";
import DataParsingService from "../services/DataParsingService";

export default class DataService {

  private static useStaging: boolean = false;
  //const webCompanionUrl = `https://opr-list-builder${useStaging ? "-staging" : ""}.herokuapp.com/api`;
  private static webCompanionUrl = 'https://opr-list-bui-feature-po-r8wmtp.herokuapp.com/api';

  public static getApiData(armyId: string, callback: (armyData: any) => void) {

    fetch(this.webCompanionUrl + `/army-books/${armyId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);

        const afData = DataService.transformApiData(data);
        console.log(afData);

        callback(afData);
      });
  }

  public static transformApiData(input) {
    const countRegex = /^(\d+)x\s/;

    return {
      ...input,
      units: input.units.map((u: IUnit) => ({
        ...u,
        equipment: u.equipment.map(e => {
          // Capture the count digit from the name
          const countMatch = countRegex.exec(e.label);
          return {
            ...e,
            label: e.label.replace(countRegex, ""),
            count: countMatch ? parseInt(countMatch[1]) * u.size : u.size
          }
        })
      })),
      upgradePackages: input.upgradePackages.map(pkg => ({
        ...pkg,
        sections: pkg.sections.map(section => ({
          ...section,
          ...DataParsingService.parseUpgradeText(section.label),
          options: section.options.map((opt: IUpgradeOption) => {
            const gains = [];
            // Iterate backwards through gains array so we can push new 
            for (let original of opt.gains) {
              // Match "2x ", etc

              // Replace "2x " in label/name of original gain
              const gain = {
                ...original,
                label: original.label?.replace(countRegex, ""),
                name: original.name?.replace(countRegex, "")
              };
              // Capture the count digit from the name
              const countMatch = countRegex.exec(original.name);
              // Parse the count if present, otherwise default to 1
              const count = countMatch ? parseInt(countMatch[1]) : 1;
              // Push the gain into the array as many times as the count
              for (let y = 0; y < count; y++) {
                gains.push(gain);
              }
            }
            return ({
              ...opt,
              id: opt.id || nanoid(5), // Assign ID to upgrade option if one doesn't exist
              gains
            });
          })
        }))
      }))
    };
  }
}