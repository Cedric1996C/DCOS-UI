import { MountService } from "foundation-ui";
/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import { Redirect, Route, hashHistory } from "react-router";
import { StoreMixin } from "mesosphere-shared-reactjs";
import reqwest from "reqwest";

import AuthenticatedUserAccountDropdown from "./components/AuthenticatedUserAccountDropdown";
import config from "./config";

const { Url } = require("url");
const querystring = require("querystring");
const SDK = require("./SDK").getSDK();

const {
  AccessDeniedPage,
  ApplicationUtil,
  Authenticated,
  AuthStore,
  ConfigStore,
  CookieUtils,
  RouterUtil,
  UsersPage,
  MetadataStore
} = SDK.get([
  "AccessDeniedPage",
  "ApplicationUtil",
  "AuthStore",
  "Authenticated",
  "ConfigStore",
  "CookieUtils",
  "RouterUtil",
  "UsersPage",
  "MetadataStore",
]);

let configResponseCallback = null;
const defaultOrganizationRoute = {
  routes: []
};

module.exports = Object.assign({}, StoreMixin, {
  actions: [
    "AJAXRequestError",
    "userLoginSuccess",
    "userLogoutSuccess",
    "redirectToLogin"
  ],

  filters: [
    "applicationRoutes",
    "delayApplicationLoad",
    "organizationRoutes",
    "serverErrorModalListeners"
  ],

  initialize() {
    this.filters.forEach(filter => {
      SDK.Hooks.addFilter(filter, this[filter].bind(this));
    });
    this.actions.forEach(action => {
      SDK.Hooks.addAction(action, this[action].bind(this));
    });
    this.store_initializeListeners([
      {
        name: "config",
        events: ["success", "error"]
      }
    ]);
    this.registerUserAccountDropdown();
  },

  navigateToLoginPage() {
    var auth = new Url();
    auth.href = config.authUrl;
    auth.query = querystring.stringify({
      response_type: 'code',
      client_id: config.clientId,
      redirect_url: config.redirectUrl
    });
    // global.location.href = "#/login";
    global.location.href = `${auth.href}/?${auth.query}`;
  },

  redirectToLogin(nextState, replace) {
    // const redirectTo = RouterUtil.getRedirectTo();
    const authCode = querystring.parse(global.location.search.replace('?','')).code;
   
    // Ignores relative path if redirect is present
    if(authCode){
      console.log("change access token", authCode)
      this.changeAccessToken(authCode);
      // replace(`/login?relativePath=${nextState.location.pathname}`);
    } else {
      this.navigateToLoginPage();
    }
  },

  // Change Access Token by code.
  changeAccessToken(code){
    reqwest({
        url: `http://${config.redirectUrl}/auth?code=${code}`,
        method: 'GET',
        crossOrigin: true,
        type: 'json',
      })
      .then(function(res){
        console.log(res)
        global.location.search = null;
        AuthStore.login(res);
        // window.location = `${config.redirectUrl}`
      })
      .catch( err => {
        console.log("no res")
      })
  },

  AJAXRequestError(xhr) {
    if (xhr.status !== 401 && xhr.status !== 403) {
      return;
    }

    const location = global.location.hash;
    const onAccessDeniedPage = /access-denied/.test(location);
    // const onLoginPage = /login/.test(location);

    // Unauthorized
    if (xhr.status === 401 && !onLoginPage && !onAccessDeniedPage) {
      global.document.cookie = CookieUtils.emptyCookieWithExpiry(
        new Date(1970)
      );
      global.location.href = "#/login";
    }

    // Forbidden
    if (xhr.status === 403 && !onLoginPage && !onAccessDeniedPage) {
      global.location.href = "#/access-denied";
    }
  },

  serverErrorModalListeners(listeners) {
    listeners.push({
      name: "auth",
      events: ["logoutError"]
    });

    return listeners;
  },

  applicationRoutes(routes) {
    // Override handler of index to be "authenticated"
    routes[0].children.forEach(function(child) {
      if (child.id === "index") {
        child.component = new Authenticated(child.component);
        child.onEnter = child.component.willTransitionTo;
      }
    });

    // Add access denied and login pages
    routes[0].children.unshift(
      {
        component: AccessDeniedPage,
        path: "/access-denied",
        type: Route
      }
    );

    return routes;
  },

  onConfigStoreSuccess() {
    if (configResponseCallback) {
      configResponseCallback();
      configResponseCallback = null;
    }
  },

  onConfigStoreError() {
    if (configResponseCallback) {
      configResponseCallback();
      configResponseCallback = null;
    }
  },

  // Ensure user route under organization
  organizationRoutes(routeDefinition = defaultOrganizationRoute) {
    const userRoute = {
      type: Route,
      path: "users",
      component: UsersPage
    };
    const usersRouteIndex = routeDefinition.routes.findIndex(function(route) {
      return route.name === userRoute.name;
    });
    // Replace by new definition
    if (usersRouteIndex !== -1) {
      routeDefinition.routes.splice(usersRouteIndex, 1, userRoute);
    }

    // Add user route if not already present
    if (usersRouteIndex === -1) {
      routeDefinition.routes.push(userRoute);
    }

    routeDefinition.redirect = {
      type: Redirect,
      from: "/organization",
      to: "/organization/users"
    };

    return routeDefinition;
  },

  registerUserAccountDropdown() {
    MountService.MountService.registerComponent(
      AuthenticatedUserAccountDropdown,
      "Sidebar:UserAccountDropdown",
      100
    );
  },

  userLoginSuccess() {
    const redirectTo = RouterUtil.getRedirectTo();
    const isValidRedirect = RouterUtil.isValidRedirect(redirectTo);

    if (isValidRedirect) {
      // global.location.href = redirectTo;
    } else {
      ApplicationUtil.beginTemporaryPolling(() => {
        const relativePath = RouterUtil.getRelativePath();
        const loginRedirectRoute = AuthStore.get("loginRedirectRoute");

        if (loginRedirectRoute && !relativePath) {
          // Go to redirect route if it is present
          hashHistory.push(loginRedirectRoute);
        } else if (relativePath) {
          global.location.replace(`${global.location.origin}/#${relativePath}`);
        } else {
          // Go to home
          hashHistory.push("/");
        }
      });
    }
  },

  userLogoutSuccess() {
    // Reload configuration because we need to get "firstUser" which is
    // dynamically set based on number of users

    configResponseCallback = this.navigateToLoginPage;
    ConfigStore.fetchConfig();
  },

  delayApplicationLoad(value) {
    const loggin = AuthStore.isLoggedIn();
    // If user is logged in, then let"s let the app do its thing
    if (loggin) {
      return value;
    }
    // Let"s wait till login and then we"ll request mesos summary before render
    return false;
  }
});
