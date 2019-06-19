/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// import $ from 'jquery';
import { assert } from 'chai';
import Metrics from 'lib/metrics';
import Notifier from 'lib/channels/notifier';
import React from 'react';
import Relier from 'models/reliers/relier';
import sinon from 'sinon';
import TestHelpers from '../../../lib/helpers';
import User from 'models/user';
import View from 'views/settings/display_name';
import {ChangeorAddButtonComponent, DisplayNameFormComponent, DisplayNameComponent} from 'views/settings/display_name';
import { render, cleanup, fireEvent, queryByText } from '@testing-library/react';

describe('views/settings/display_name', function () {

  afterEach(() => {
    cleanup();
  });

  describe('ChangeorAddButtonComponent', () => {
    function renderButtonComponent (displayName = ''){
      render(
        <ChangeorAddButtonComponent displayName={displayName}/>
      );
    }

    it('renders the button correctly without displayName set', () => {
      renderButtonComponent('');
      const settingsButtons = document.querySelectorAll('.settings-button');
      assert.lengthOf(settingsButtons, 1);
      assert.include(settingsButtons[0].innerText, 'Add');
    });

    it('renders the button correctly with a displayName set', () => {
      renderButtonComponent('joe');

      const settingsButtons = document.querySelectorAll('.settings-button');
      assert.lengthOf(settingsButtons, 1);
      assert.include(settingsButtons[0].innerText, 'Change');
    });
  });

  describe('DisplayNameComponent', () => {
    function renderDisplayNameComponent (){
      render(
        <DisplayNameComponent />
      );
    }

    it('renders correctly', () => {
      renderDisplayNameComponent();
      
      const headerEls = document.querySelectorAll('.settings-unit-summary');
      assert.lengthOf(headerEls, 1);
      assert.include(headerEls[0].innerText, 'Display name');
    });
  });

  describe('DisplayNameFormComponent', ()=>{
    var account;
    var email;
    var user;
    beforeEach(function () {
      email = TestHelpers.createEmail();
      user = new User();
      account = user.initAccount({
        email: email,
        sessionToken: 'fake session token',
        uid: 'uid',
        verified: true
      });
    });
    function renderDisplayNameFormComponent (displayName = ''){
      render(
        <DisplayNameFormComponent displayName={displayName} account={account}/>
      );
    }

    it('validates the display name field for changes:name did not change',() => {
      account.set('displayName', 'joe');
      renderDisplayNameFormComponent('joe');

      const submitDisplay = document.querySelectorAll('#submit_display');
      assert.lengthOf(submitDisplay, 1);
      console.log(submitDisplay[0].attributes.disabled);
      assert.equal(submitDisplay[0].getAttribute('disabled'),'','name did not change');
    });

    it('validates the display name field for changes:name changed',() => {
      account.set('displayName', 'joe');
      renderDisplayNameFormComponent('joe changed');

      const submitDisplay = document.querySelectorAll('#submit_display');
      const displayName = document.querySelectorAll('.display-name');
      console.log('here');
      console.log(document.querySelectorAll('.display-name'));
      assert.lengthOf(submitDisplay, 1);
      assert.lengthOf(displayName,1);
      displayName[0].value = 'joe changed';
      console.log(submitDisplay[0].attributes.disabled);
      console.log(submitDisplay[0].attributes.align);
      console.log(account.get('displayName'));
      assert.equal(submitDisplay[0].attributes.disabled,null,'name changed');
    });
  });

  describe('submit', function () {
    var account;
    var email;
    var user;
    var metrics;
    var notifier;
    var relier;
    var view;

    beforeEach(function () {
      email = TestHelpers.createEmail();
      user = new User();
      relier = new Relier();
      notifier = new Notifier();
      metrics = new Metrics({notifier});
      // view = new View();
      account = user.initAccount({
        email: email,
        sessionToken: 'fake session token',
        uid: 'uid',
        verified: true
      });
    });

    afterEach(function () {
      metrics.destroy();

      view.remove();
      view.destroy();

      view = metrics = null;
    });
    it('submits correctly', function () {
      var name = '  joe cool  ';
      sinon.stub(account, 'postDisplayName').callsFake(function () {
        return Promise.resolve();
      });
      function renderDisplayNameFormComponent (displayName = ''){
        view = new View({
          metrics: metrics,
          notifier: notifier,
          relier: relier,
          user: user
        });
        sinon.stub(view, 'getSignedInAccount').callsFake(function () {
          return account;
        });
        sinon.stub(view, 'checkAuthorization').callsFake(function () {
          return Promise.resolve(true);
        });
        sinon.stub(account, 'fetchProfile').callsFake(function () {
          return Promise.resolve();
        });
        sinon.stub(user, 'setAccount').callsFake(function () {
          return Promise.resolve();
        });
        return view.render(displayName)
          .then(function (displayName) {
            render(
              <DisplayNameFormComponent displayName={displayName} account={account}/>
            );
          });
      }
      return renderDisplayNameFormComponent(name)
        .then(() => {
          sinon.stub(view, 'updateDisplayName').callsFake(function () {
            return Promise.resolve();
          });
          sinon.stub(view, 'displaySuccess').callsFake(function () {
            return Promise.resolve();
          });
          sinon.spy(view, 'logFlowEvent');
          sinon.spy(view, 'render');
          sinon.spy(view, 'navigate');

          // view.$('input.display-name').val(name);
          return view.submit(name);
        })
        .then(() => {
          console.log(name);
          const expectedName = name.trim();
          console.log(account);
          console.log(view);
          console.log(expectedName);
          console.log(account);
          assert.isTrue(account.postDisplayName.calledWith(expectedName));
          assert.isTrue(view.updateDisplayName.calledWith(expectedName));
          assert.isTrue(view.displaySuccess.called);
          assert.isTrue(TestHelpers.isEventLogged(metrics,
            'settings.display-name.success'));
          assert.isTrue(view.navigate.calledWith('settings'));

          assert.equal(view.logFlowEvent.callCount, 1);
          const args = view.logFlowEvent.args[0];
          assert.lengthOf(args, 1);
          const eventParts = args[0].split('.');
          assert.lengthOf(eventParts, 4);
          assert.equal(eventParts[0], 'timing');
          assert.equal(eventParts[1], 'displayName');
          assert.equal(eventParts[2], 'change');
          assert.match(eventParts[3], /^[0-9]+$/);
        });
    });

  });

});