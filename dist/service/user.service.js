"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = require("../models/user.model");
class UserService {
    static insertUser(param, transaction = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const new_user = new user_model_1.User(param);
            return new_user.save(Object.assign({}, transaction));
        });
    }
    static editUser(param, filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_model_1.User.update(param, filter);
        });
    }
    static fetchUsers(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options === null || options === void 0 ? void 0 : options.scope) {
                return user_model_1.User.scope(options.scope).findAll(filter);
            }
            return user_model_1.User.findAll(filter);
        });
    }
    static fetchUser(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options === null || options === void 0 ? void 0 : options.scope) {
                return user_model_1.User.scope(options.scope).findOne(filter);
            }
            return user_model_1.User.findOne(filter);
        });
    }
    static fetchUserById(user_id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options === null || options === void 0 ? void 0 : options.scope) {
                return user_model_1.User.scope(options.scope).findByPk(user_id);
            }
            return user_model_1.User.findByPk(user_id);
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map