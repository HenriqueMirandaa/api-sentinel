import { app } from "./app";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);

app.listen(port, () => {
  console.log(`API Sentinel API listening on port ${port}`);
});
