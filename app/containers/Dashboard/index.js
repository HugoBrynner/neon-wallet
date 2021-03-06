// @flow
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Dashboard from './Dashboard'
import { togglePane, getSendPane, getConfirmPane } from '../../modules/dashboard'
import { logout, getAddress } from '../../modules/account'
import { getBlockHeight, getNetwork } from '../../modules/metadata'
import { getNotification } from '../../modules/notification'

const mapStateToProps = (state: Object) => ({
  sendPane: getSendPane(state),
  confirmPane: getConfirmPane(state),
  blockHeight: getBlockHeight(state),
  net: getNetwork(state),
  address: getAddress(state),
  notification: getNotification(state)
})

const actionCreators = {
  togglePane,
  logout
}

const mapDispatchToProps = dispatch => bindActionCreators(actionCreators, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)
