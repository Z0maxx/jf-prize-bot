import express from "express"
import { getInventoryAsync, reloadInventoryAsync } from "./inventory/inventory"
import "dotenv/config"
import { getPlayersAsync, savePlayersAsync } from "./players"
import { getPrizesAsync, savePrizesAsync } from "./prizes"
import { z } from "zod"
import { PlayerSchema, PrizeSchema } from "@jf-prize-bot/schema"

const PrizesSchema = z.array(PrizeSchema)
const PlayersSchema = z.array(PlayerSchema)

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
  if (PrizesSchema.safeParse(req.body).success) {
    await savePlayersAsync(req.body)
    res.status(201).send()
  }
  else {
    res.status(400).send()
  }
})

app.post('/prizes', async (req, res) => {
  if (PlayersSchema.safeParse(req.body)) {
    await savePrizesAsync(req.body)
    res.status(201).send()
  }
  else {
    res.status(400).send()
  }
})

app.listen(6520, () => console.log('Running'))