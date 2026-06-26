import express from "express"
import { getInventoryAsync, reloadInventoryAsync } from "./inventory/inventory"
import "dotenv/config"
import { getPlayersAsync, savePlayersAsync } from "./players"
import { getPrizesAsync, savePrizesAsync } from "./prizes"

const app = express()
app.use(express.json())

app.use(function(_, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/bot-inventory', async (_, res) => {
  res.status(200).json(await getInventoryAsync())
})

app.get('/reload-bot-inventory', async (_, res) => {
  try {
    res.status(200).json(await reloadInventoryAsync())
  }
  catch {
    res.status(503).send()
  }
})

app.get('/players', async (_, res) => {
  res.status(200).json(await getPlayersAsync())
})

app.get('/prizes', async (_, res) => {
  res.status(200).json(await getPrizesAsync())
})

app.post('/players', async (req, res) => {
  await savePlayersAsync(req.body)
  res.status(201).send()
})

app.post('/prizes', async (req, res) => {
  await savePrizesAsync(req.body)
  res.status(201).send()
})

app.listen(6520, () => console.log('Running'))