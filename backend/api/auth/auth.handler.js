const loginV1 = require("./crud/login.v1");
const registerV1 = require("./crud/register.v1");
const logoutV1 = require("./crud/logout.v1");
const getProfileV1 = require("./crud/getProfile.v1");
const updateProfileV1 = require("./crud/updateProfile.v1");

exports.login = loginV1;
exports.register = registerV1;
exports.logout = logoutV1;
exports.getProfile = getProfileV1;
exports.updateProfile = updateProfileV1;
