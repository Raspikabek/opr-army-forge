import Head from "next/head";
import "../styles/globals.css";
import dynamic from "next/dynamic";
import { store } from "../data/store";
import { Provider, useDispatch, useSelector } from "react-redux";
import pluralise from "pluralize";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import ReleaseNotes from "../views/components/ReleaseNotes";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useMemo } from "react";
import { setDarkMode } from "../data/appSlice";
import { appWithTranslation } from 'next-i18next';

// TODO: Better place for global generic things to go?
pluralise.addSingularRule(/Fuses$/i, "Fuse"); // Spear-Fuses -> Spear-Fuse
pluralise.addSingularRule(/Axes$/i, "Axe"); // Axes -> Axe

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>OPR Army Forge Beta</title>
        <meta name="description" content="OPR Army Forge List Builder" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&&family=Source+Sans+Pro:wght@400;500;600;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Provider store={store}>
        <ThemedApp Component={Component} pageProps={pageProps} />
      </Provider>
    </>
  );
}

const getDesignTokens = (darkMode) => ({
  palette: {
    mode: darkMode ? "dark" : "light",
    ...(darkMode
      ? {
          // palette values for dark mode
          background: {
            default: "#202125",
            paper: "#202125",
          },
        }
      : {}),
  },
  typography: {
    fontFamily: "Source Sans Pro",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "1.25px",
        },
      },
    },
  },
});

const ThemedApp = ({ Component, pageProps }) => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.app.darkMode);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", { noSsr: true });

  useEffect(() => {
    console.log("darkMode", darkMode);
    console.log("prefersDarkMode", prefersDarkMode);
    if (darkMode === undefined) {
      dispatch(setDarkMode(prefersDarkMode));
    }
  }, [darkMode]);

  const theme = useMemo(() => createTheme(getDesignTokens(darkMode)), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Component {...pageProps} />
      <ReleaseNotes />
    </ThemeProvider>
  );
};


export default dynamic(() => Promise.resolve(appWithTranslation(App)), { ssr: false });
