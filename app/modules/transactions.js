// @flow
/* eslint-disable camelcase */

import { ASSETS_LABELS, ASSETS } from '../core/constants'
import { validateTransactionBeforeSending } from '../core/wallet'
import { getTransactionHistory, doSendAsset, hardwareDoSendAsset } from 'neon-js'
import { setTransactionHistory, getNeo, getGas } from './wallet'
import { log } from '../util/Logs'
import { showErrorNotification, showInfoNotification, showSuccessNotification } from './notification'
import { getWif, getPublicKey, getSigningFunction, getAddress } from './account'
import { getNetwork } from './metadata'
import asyncWrap from '../core/asyncHelper'

// Constants
export const TOGGLE_ASSET = 'TOGGLE_ASSET'

export function toggleAsset () {
  return {
    type: TOGGLE_ASSET
  }
}

export const syncTransactionHistory = (net: NetworkType, address: string) => async (dispatch: DispatchType) => {
  const [_err, transactions] = await asyncWrap(getTransactionHistory(net, address)) // eslint-disable-line
  const txs = transactions.map(({ NEO, GAS, txid, block_index, neo_sent, neo_gas }: TransactionHistoryType) => ({
    type: neo_sent ? ASSETS.NEO : ASSETS.GAS,
    amount: neo_sent ? NEO : GAS,
    txid,
    block_index
  }))
  return dispatch(setTransactionHistory(txs))
}

export const sendTransaction = (sendAddress: string, sendAmount: string) => async (dispatch: DispatchType, getState: GetStateType): Promise<*> => {
  const state = getState()
  const wif = getWif(state)
  const address = getAddress(state)
  const net = getNetwork(state)
  const neo = getNeo(state)
  const gas = getGas(state)
  const selectedAsset = getSelectedAsset(state)
  const signingFunction = getSigningFunction(state)
  const publicKey = getPublicKey(state)

  const rejectTransaction = (message: string) => dispatch(showErrorNotification({ message }))

  const { error, valid } = validateTransactionBeforeSending(neo, gas, selectedAsset, sendAddress, sendAmount)
  if (valid) {
    const selfAddress = address
    const assetName = selectedAsset === ASSETS_LABELS.NEO ? ASSETS.NEO : ASSETS.GAS
    let sendAsset = {}
    sendAsset[assetName] = sendAmount

    dispatch(showInfoNotification({ message: 'Processing...', dismissible: false }))
    log(net, 'SEND', selfAddress, { to: sendAddress, asset: selectedAsset, amount: sendAmount })

    const isHardwareSend = !!publicKey

    let sendAssetFn
    if (isHardwareSend) {
      dispatch(showInfoNotification({ message: 'Please sign the transaction on your hardware device', dismissible: false }))
      sendAssetFn = () => hardwareDoSendAsset(net, sendAddress, publicKey, sendAsset, signingFunction)
    } else {
      sendAssetFn = () => doSendAsset(net, sendAddress, wif, sendAsset)
    }

    const [err, response] = await asyncWrap(sendAssetFn())
    if (err || response.result === undefined || response.result === false) {
      return rejectTransaction('Transaction failed!')
    } else {
      return dispatch(showSuccessNotification({ message: 'Transaction complete! Your balance will automatically update when the blockchain has processed it.' }))
    }
  } else {
    return rejectTransaction(error)
  }
}

// state getters
export const getSelectedAsset = (state) => state.transactions.selectedAsset

const initialState = {
  selectedAsset: ASSETS_LABELS.NEO
}

export default (state: Object = initialState, action: Object) => {
  switch (action.type) {
    case TOGGLE_ASSET:
      return {
        ...state,
        selectedAsset: state.selectedAsset === ASSETS_LABELS.NEO ? ASSETS_LABELS.GAS : ASSETS_LABELS.NEO
      }
    default:
      return state
  }
}
