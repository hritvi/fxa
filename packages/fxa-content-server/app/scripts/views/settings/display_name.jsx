/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import AvatarMixin from '../mixins/avatar-mixin';
import Cocktail from 'cocktail';
import BaseView from '../base';
import SettingsPanelMixin from '../mixins/settings-panel-mixin';
import React from 'react';
import ReactDOM from 'react-dom';
import Translator from '../../lib/translator';

const translator = new Translator();

const t = msg => translator.get(msg);

function DisplayName(props) {
  return (
    <div id="display-name" className="settings-unit">
      <div className="settings-unit-stub">
        <DisplayNameComponent />
        <ChangeorAddButtonComponent displayName={props.displayName} />
      </div>
      <div className="settings-unit-details">
        <div className="error" />
        <DisplayNameFormComponent
          account={props.account}
          submit={props.submit}
          displayName={props.displayName}
        />
      </div>
    </div>
  );
}
export function DisplayNameComponent() {
  return (
    <header className="settings-unit-summary">
      <h2 className="settings-unit-title">{t('Display name')}</h2>
    </header>
  );
}
export function ChangeorAddButtonComponent(props) {
  const displayName = props.displayName;
  if (displayName) {
    return (
      <button
        className="settings-button secondary-button settings-unit-toggle"
        data-href="settings/display_name"
      >
        <span className="change-button">{t('Change…')}</span>
      </button>
    );
  } else {
    return (
      <button
        className="settings-button primary-button settings-unit-toggle"
        data-href="settings/display_name"
      >
        <span className="add-button">{t('Add…')}</span>
      </button>
    );
  }
}
export class DisplayNameFormComponent extends React.Component {
  constructor(props) {
    super(props);
    this.isValid = this.isValid.bind(this);
    const accountDisplayName = props.account.get('displayName') || '';

    this.state = {
      disableChangeButton: this.props.displayName === accountDisplayName,
      displayName: accountDisplayName
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

    handleChange = event => {
      console.log('called');
      this.setState({
        displayName: event.target.value
      }, ()=>{
        this.isValid();
      });
    };

    isValid (){
      console.log('is valid called');
      if (this.props.displayName !== this.state.displayName){
        this.setState({disableChangeButton: 0});
      } else {
        this.setState({disableChangeButton: 1});
      }
    }

    handleSubmit = event => {
      event.preventDefault();
      this.setState({ disableChangeButton: 1 }, () => {
        this.props.submit(this.state.displayName);
      });
    };

    render() {
      return (
        <form noValidate onSubmit={this.handleSubmit}>
          <p>
            {t(
              'Choose the name you would like to appear in Firefox and when managing your account.'
            )}
          </p>
          <div className="input-row">
            <input
              type="text"
              className="text display-name"
              placeholder={t('Display name')}
              value={this.state.displayName}
              onChange={this.handleChange}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="button-row">
            <button
              type="submit"
              id="submit_display"
              className="settings-button primary-button"
              disabled={this.state.disableChangeButton}
            >
              {t('Change')}
            </button>
            <button className="settings-button secondary-button cancel">
              {t('Cancel')}
            </button>
          </div>
        </form>
      );
    }
}

const View = BaseView.extend({
  template: () => '<div />', //Template,
  className: 'display-name',

  onProfileUpdate() {
    this.render();
  },

  submit(displayName) {
    const start = Date.now();
    const account = this.getSignedInAccount();
    displayName = displayName.trim();
    return account.postDisplayName(displayName).then(() => {
      this.logViewEvent('success');
      this.updateDisplayName(displayName);
      this.displaySuccess(t('Display name updated'));
      this.logFlowEvent(
        `timing.displayName.change.${Date.now() - start}`
      );
      this.navigate('settings');
    });
  },

  render() {
    var account = this.getSignedInAccount();
    return Promise.all([
      translator.fetch(),
      account.fetchProfile()
    ]).then(() => {
      ReactDOM.render(
        <DisplayName
          account={account}
          submit={displayName => this.submit(displayName)}
          displayName={account.get('displayName')}
        />,
        this.$el.get(0)
      );
      return true;
    });
  }
});

Cocktail.mixin(
  View,
  AvatarMixin,
  // DisableFormMixin,
  SettingsPanelMixin
);

export default View;
