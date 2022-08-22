import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";
import { Box, Button, Container, createTheme, Stack } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AddIcon from "@mui/icons-material/Add";
import { GetServerSidePropsContext } from "next";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export async function getServerSideProps(context: GetServerSidePropsContext, locale) {
  const host = context.req.headers.host;
  const vercelProd = "opr-army-forge.vercel.app";
  const isVercelProd = host?.toLocaleLowerCase() === vercelProd;

  return isVercelProd
    ? {
        redirect: {
          permanent: true,
          destination: "https://army-forge.onepagerules.com/",
        },
      }
    : { props: {
      ...(await serverSideTranslations(context.locale ? context.locale : 'en', ['common']))
    } };
}

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <Container className={styles.homeContainer + " container"}>
      <div className={styles.outerColumn}>
        <Box mx="auto" pt={6} textAlign="center" className={styles.homeColumn}>
          <div>
            <h1 className={styles.title} style={{ letterSpacing: "8px", margin: 0 }}>
              ARMY
            </h1>
            <Box mx="auto" className={styles.logo}></Box>
            <h1 className={styles.title} style={{ margin: 0 }}>
              FORGE
              <div className={styles.betaTag}></div>
            </h1>
          </div>

          <Stack spacing={2} className={styles.buttonContainer}>
            <Button
              variant="contained"
              color="primary"
              className="mb-4"
              onClick={() => router.push("/gameSystem")}
            >
              <AddIcon /> <span style={{ fontWeight: 600 }}>&nbsp;{t('createNewList')}</span>
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: "white",
                color: "white",
                background: "rgba(255,255,255,.2)",
                "&:hover": {
                  borderColor: "white",
                  background: "rgba(255,255,255,.3)",
                },
              }}
              onClick={() => router.push("/load")}
            >
              <FolderOpenIcon /> <span style={{ fontWeight: 600 }}>&nbsp;&nbsp;Open A List</span>
            </Button>
          </Stack>
        </Box>
      </div>
    </Container>
  );
}
