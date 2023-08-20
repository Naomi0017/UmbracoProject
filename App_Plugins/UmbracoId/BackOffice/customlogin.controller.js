(function () {
  "use strict";

  function CustomLoginController($scope, $location, userService, umbRequestHelper, $http, $cookies, authResource, currentUserResource) {

    var vm = this;
    vm.state = "login";
    vm.externalLoginFormAction = Umbraco.Sys.ServerVariables.umbracoUrls.externalLoginsUrl;
    vm.submitUmbIdProfileForm = submitUmbIdProfileForm;
    vm.submitUmbIdPasswordForm = submitUmbIdPasswordForm;
    vm.setIsUmbracoIdUser = setIsUmbracoIdUser;
    vm.isUmbracoIdUser = true;
    vm.loadingUmbracoIdSetting = true;
    vm.isLocalLogin = false;

    const backOfficeUrl = getBackOfficeUrl();

    function init() {

      userService.isAuthenticated().then(function () {
        vm.state = "backoffice";
        vm.isLocalLogin = Umbraco.Sys.ServerVariables.umbId.isLocalLogin;
        // set the back office custom form oauth challenge endpoint to our UmbracoIdProfileEditController
        vm.umbIdProfileFormEndpoint = Umbraco.Sys.ServerVariables.umbId.urls.profile;
        vm.umbIdPasswordFormEndpoint = Umbraco.Sys.ServerVariables.umbId.urls.password;
        vm.setIsUmbracoIdUser();

      }, function () {
        vm.isLocalLogin = Umbraco.Sys.ServerVariables.umbId?.isLocalLogin; // Server variables are initialized during first successfull login, hence the null accessor.
        // check if we are on the login or logout page and adjust the state
        if ($location.url().startsWith('/login/false') && !$location.search().returnPath) {
          vm.state = "logout";
        }

        if(vm.isLocalLogin){
          return; // Don't bother getting signout url if we are local login.
        }
        getSignOutUrl().then(function (response) {
          // set the umb id logout url
          vm.umbIdSignOutEndpoint = response.signOutUrl;

        });
      });
    }

    function getSignOutUrl() {
      // we need to build the URL manually because we cannot use server vars since we are logged out.
      // I would rather not hard code this but we don't have much choice apart from hacking the planet elsewhere.
      var endpoint = backOfficeUrl + "/backoffice/UmbracoId/UmbracoIdBackOffice/GetSignOutUrl";

      return umbRequestHelper.resourcePromise(
        $http.get(endpoint),
        'Failed to retrieve back office url');
    }


    function submitUmbIdProfileForm(e) {
      e.target.submit();
    }
    function submitUmbIdPasswordForm(e) {
      e.target.submit();
    }


    function getBackOfficeUrl() {
      let backOfficeUrl = $location.absUrl();
      let hash = backOfficeUrl.indexOf("#");
      if (hash > 0) {
        backOfficeUrl = backOfficeUrl.substr(0, hash);
      }
      return backOfficeUrl.trimEnd("/").toLowerCase();
    }

    function setIsUmbracoIdUser() {
      // This is a compat hack for v9
      let getCurrentUserLinkedLogins = authResource.getCurrentUserLinkedLogins;
      if (!getCurrentUserLinkedLogins) {
        getCurrentUserLinkedLogins = currentUserResource.getCurrentUserLinkedLogins;
      }

      getCurrentUserLinkedLogins().then(function (logins) {
        vm.isUmbracoIdUser = false;
        for (var login in logins) {
          if (login === Umbraco.Sys.ServerVariables.umbId.authType) {
            vm.isUmbracoIdUser = true;
            break;
          }
        }

        vm.loadingUmbracoIdSetting = false;
      });
    }
    init();

  }

  angular.module("umbraco").controller("Umbraco.Cloud.Identity.CustomLoginController", CustomLoginController);

})();
