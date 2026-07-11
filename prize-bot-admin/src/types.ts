import { snackbarMessageTypes } from './constants/snackbarMessageTypes'

export type SnackbarMessageType = keyof typeof snackbarMessageTypes

export type SnackbarMessage = {
  text: string
  type: SnackbarMessageType
}
