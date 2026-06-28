import express from "express"
import { getInventoryAsync, reloadInventoryAsync } from "./inventory/inventory"
import "dotenv/config"
import { getPlayersAsync, savePlayersAsync } from "./players"
import { getPrizesAsync, savePrizesAsync } from "./prizes"
import { z } from "zod"
import { PlayerSchema, PrizeSchema, SteamCredentialsSchema, SteamGuardCodeSchema } from "@jf-prize-bot/schema"
import { isLoggedIn, logInAsync, sendPrizesAsync, setSteamGuardCodeAsync } from "./steamActions"

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

app.get('/is-logged-in', async (_, res) => {
  res.status(200).json({ isLoggedIn: isLoggedIn() })
})

app.post('/players', async (req, res) => {
  const parsed = PlayersSchema.safeParse(req.body)
  if (parsed.success) {
    await savePlayersAsync(parsed.data)
    res.status(201).send()
  }
  else {
    res.status(400).send(parsed.error)
  }
})

app.post('/prizes', async (req, res) => {
  const parsed = PrizesSchema.safeParse(req.body)
  if (parsed.success) {
    await savePrizesAsync(parsed.data)
    res.status(201).send()
  }
  else {
    res.status(400).send(parsed.error)
  }
})

app.post('/login', async (req, res) => {
  const parsed = SteamCredentialsSchema.safeParse(req.body)
  if (parsed.success) {
    res.status(200).send(await logInAsync(parsed.data))
  }
  else {
    res.status(400).send(parsed.error)
  }
})

app.post('/steam-guard-code', async (req, res) => {
  const parsed = SteamGuardCodeSchema.safeParse(req.body)
  if (parsed.success) {
    res.status(200).send(await setSteamGuardCodeAsync(parsed.data.steamGuardCode))
  }
  else {
    res.status(400).send(parsed.error)
  }
})

app.post('/send-prizes', async (_, res) => {
  const prizes = await getPrizesAsync()
  const result = await sendPrizesAsync(prizes)
  savePrizesAsync(prizes)
  return res.status(200).send(result)
})

app.listen(6520, () => console.log('Running'))