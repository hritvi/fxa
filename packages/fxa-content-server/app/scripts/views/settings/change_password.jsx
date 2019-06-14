/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AuthErrors from '../../lib/auth-errors';
import BackMixin from '../mixins/back-mixin';
import Cocktail from 'cocktail';
import BaseView from '../form';
import ExperimentMixin from '../mixins/experiment-mixin';
import PasswordMixin from '../mixins/password-mixin';
import PasswordStrengthMixin from '../mixins/password-strength-mixin';
import ServiceMixin from '../mixins/service-mixin';
import SettingsPanelMixin from '../mixins/settings-panel-mixin';
import Template from 'templates/settings/change_password.mustache';
// eslint-disable-next-line
 import React from 'react';
import ReactDOM from 'react-dom';

const t = msg => msg;

function ChangePassword(props){
  return (
    <div id="change-password" className="settings-unit">
      <div className="settings-unit-stub">
        <header className="settings-unit-summary">
          <h2 className="settings-unit-title">Password</h2>
        </header>
        <button className="settings-button secondary-button settings-unit-toggle" data-href="settings/change_password">Change...</button>
      </div>
      <ChangePasswordForm
        account={props.account}
        submit={props.submit}
      />
    </div>
  );
}

class ChangePasswordForm extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      mail: props.account.get('email') || '',
      newPass: '',
      newVPass: '',
      oldPass: ''
    };
    this.getOldPassword = this.getOldPassword.bind(this);
    this.getNewPassword = this.getNewPassword.bind(this);
    this.getNewVPassword = this.getNewVPassword.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
   getOldPassword = event => {
     this.setState({
       oldPass: event.target.value
     });
   }
 
   getNewPassword = event => {
     this.setState({
       newPass: event.target.value
     });
   }
 
   getNewVPassword = event => {
     this.setState({
       newVPass: event.target.value
     });
   }
 
   handleSubmit = event => {
     event.preventDefault();
     this.props.submit(this.state.oldPass, this.state.newPass);
   };
 
   render(){
     return (
       <div className="settings-unit-details">
         <div className="error"></div>
 
         <form noValidate onSubmit={this.handleSubmit}>
           <p>
             Once you're finished, use your new password to sign in on all of your devices.
           </p>
           {/* hidden email field is to allow Fx password manager to correctly save the updated password.
           Without it, the password manager saves the old_password as the username. */}
           <input type="email" defaultValue={this.state.mail} className="hidden" />
           <div className="input-row password-row">
             <input type="password" className="password" id="old_password" placeholder="Old password" required pattern=".{8,}" autoFocus onChange={this.getOldPassword}/>
 
             <div className="input-help input-help-forgot-pw links centered"><a href="/reset_password" className="reset-password">Forgot password?</a></div>
           </div>
 
           <div className="input-row password-row">
             <input
               type="password"
               className="password check-password tooltip-below"
               id="new_password"
               placeholder="New password"
               required pattern=".{8,}"
               data-synchronize-show="true"
               onChange={this.getNewPassword}
             />
             <div className="helper-balloon"></div>
           </div>
 
           <div className="input-row password-row">
             <input 
               type="password"
               className="password check-password tooltip-below"
               id="new_vpassword"
               placeholder="Re-enter password"
               required pattern=".{8,}"
               data-synchronize-show="true"
               onChange={this.getNewVPassword}
             />
           </div>
 
           <div className="button-row">
             <button type="submit" className="settings-button primary-button">Change</button>
             <button className="settings-button secondary-button cancel">Cancel</button>
           </div>
         </form>
       </div>
     );
   }
}
 
const View = BaseView.extend({
  template: Template,
  classNameName: 'change-password',
  viewName: 'settings.change-password',
 
  // getAccount () {
  //   return this.getSignedInAccount();
  // },
 
  afterVisible () {
    ReactDOM.render(
      <ChangePassword
        account={this.getSignedInAccount()}
        submit={(oldPassword, newPassword)=>this.submit(oldPassword, newPassword)}
      />,
      this.$el.get(0)
    );
  },
 
  // setInitialContext (context) {
  //   const account = this.getAccount();
  //   context.set('email', account.get('email'));
  // },
 
  isValidEnd () {
    return this._getNewPassword() === this._getNewVPassword();
  },
 
  showValidationErrorsEnd () {
    if (this._getNewPassword() !== this._getNewVPassword()) {
      const err = AuthErrors.toError('PASSWORDS_DO_NOT_MATCH');
      this.showValidationError(this.$('#new_vpassword'), err);
    }
  },
 
  submit (oldPassword, newPassword) {
    var account = this.getSignedInAccount();
    // var oldPassword = this._getOldPassword();
    // var newPassword = this._getNewPassword();
 
    this.hideError();
 
    return this.user.changeAccountPassword(
      account,
      oldPassword,
      newPassword,
      this.relier
    ).then(() => {
      this.logViewEvent('success');
      return this.invokeBrokerMethod('afterChangePassword', account);
    }).then(() => {
      this.displaySuccess(t('Password changed successfully'));
      this.navigate('settings');
 
      return this.render();
    }).catch((err) => {
      if (AuthErrors.is(err, 'INCORRECT_PASSWORD')) {
        return this.showValidationError(this.$('#old_password'), err);
      } else if (AuthErrors.is(err, 'PASSWORDS_MUST_BE_DIFFERENT')) {
        return this.showValidationError(this.$('#new_password'), err);
      }
      throw err;
    });
  },
});
 
Cocktail.mixin(
  View,
  ExperimentMixin,
  PasswordMixin,
  PasswordStrengthMixin({
    balloonEl: '.helper-balloon',
    passwordEl: '#new_password'
  }),
  SettingsPanelMixin,
  ServiceMixin,
  BackMixin
);
 
export default View;
 