"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = __importDefault(require("../models"));
const config_1 = __importDefault(require("../config/config"));
const course_model_1 = require("../models/course.model");
const common_1 = require("../helpers/common");
const user_validation_1 = require("../validation/user.validation");
const handleError_1 = require("../helpers/handleError");
const user_1 = require("../helpers/user");
const file_1 = require("../helpers/file");
const index_service_1 = require("../service/index.service");
const lesson_model_1 = require("../models/lesson.model");
const lesson_user_model_1 = require("../models/lesson_user.model");
const exercise_model_1 = require("../models/exercise.model");
const exercise_user_model_1 = require("../models/exercise_user.model");
const step_validation_model_1 = require("../models/step_validation.model");
exports.default = {
    updateLoggedUserProfile: async (req, res, 
    // <IResponse<UserResponse>, {}>,
    next) => {
        try {
            const { error } = user_validation_1.updateUserSchema.validate(req.body);
            if (error) {
                (0, handleError_1.handleError)(error.message, 400);
            }
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user not exist!", 404);
            }
            const update_info = { ...req.body };
            let profile_url;
            let key = user === null || user === void 0 ? void 0 : user.avatar;
            if (req.file) {
                key = await (0, file_1.saveImage)(req.file, config_1.default.AWS_PROFILE_FOLDER);
                (user === null || user === void 0 ? void 0 : user.avatar) && (await (0, file_1.removeImage)(user.avatar));
                update_info.avatar = key;
            }
            if (key) {
                profile_url = await (0, file_1.getImage)(key);
            }
            await index_service_1.UserService.editUser(update_info, {
                where: {
                    id: user === null || user === void 0 ? void 0 : user.id,
                },
            });
            user.reload();
            return res.status(201).json((0, user_1.mapUserRole)(user, profile_url));
        }
        catch (err) {
            next(err);
        }
    },
    getLoggedUserProfile: async (req, res, next) => {
        try {
            const user = await (0, user_1.getLoggedUser)(req);
            let profile_url;
            if (!user) {
                return (0, handleError_1.handleError)("access forbidden", 403);
            }
            if (user && (user === null || user === void 0 ? void 0 : user.avatar)) {
                profile_url = await (0, file_1.getImage)(user === null || user === void 0 ? void 0 : user.avatar);
            }
            return res.status(200).json((0, user_1.mapUserRole)(user, profile_url));
        }
        catch (err) {
            next(err);
        }
    },
    registerLoggedUserForCourse: async (req, res, next) => {
        try {
            const { course_id } = req.body;
            const { error } = user_validation_1.courseToLoggedUserSchema.validate({
                course_id,
            });
            if (error) {
                (0, handleError_1.handleError)(error.message, 400);
            }
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user not exist", 404);
            }
            const existing_user_courses = await user.$get("courses");
            if (existing_user_courses === null || existing_user_courses === void 0 ? void 0 : existing_user_courses.find((e) => e.id === course_id)) {
                (0, handleError_1.handleError)("This user already registerd for the course", 403);
            }
            const course = await index_service_1.CourseService.fetchCourse({
                where: { id: course_id },
                include: [
                    {
                        model: lesson_model_1.Lesson,
                        include: [
                            {
                                model: lesson_user_model_1.Lesson_User,
                            },
                            {
                                model: exercise_model_1.Exercise,
                            },
                        ],
                    },
                ],
            });
            if (!course) {
                return (0, handleError_1.handleError)("Course not exist", 404);
            }
            return await models_1.default.transaction(async (t) => {
                const [course_user] = (await (user === null || user === void 0 ? void 0 : user.$add("course", course, {
                    transaction: t,
                })));
                const lesson_users = (await (user === null || user === void 0 ? void 0 : user.$add("lessons", course.lessons, {
                    through: { courseUserId: course_user.id },
                    transaction: t,
                })));
                for (let lesson of (course === null || course === void 0 ? void 0 : course.lessons) || []) {
                    let lesson_user = lesson_users.find((e) => e.lessonId === lesson.id);
                    lesson_user &&
                        (await (user === null || user === void 0 ? void 0 : user.$add("exercises", lesson.exercises, {
                            through: { lessonUserId: lesson_user.id },
                            transaction: t,
                        })));
                }
                const collection = await course.$get("collection");
                if (!collection)
                    return res.status(201).json(course);
                if (await collection.$has("user", user))
                    return res.status(201).json(course);
                await collection.$add("user", user, { transaction: t });
                return res.status(201).json(course);
            });
        }
        catch (err) {
            next(err);
        }
    },
    startCourse: async (req, res, next) => {
        try {
            const { course_id, force } = req.body;
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user does not exist", 404);
            }
            if (!force) {
                const prereq_info = await index_service_1.CourseService.coursePrerequisiteNotCompleted(course_id, user.id);
                if (prereq_info &&
                    prereq_info.prereq &&
                    prereq_info.prereq.length > 0) {
                    return res.status(403).json({
                        message: "Would you like to continue without completing the prerequisite course?",
                        data: prereq_info,
                        status: false,
                    });
                }
            }
            const leastOrderLesson = await index_service_1.LessonService.fetchLesson({
                where: { courseId: course_id },
                order: [
                    ["order", "ASC"],
                    ["createdAt", "ASC"],
                ],
            });
            if (!leastOrderLesson) {
                return (0, handleError_1.handleError)("unable to find the lesson", 404);
            }
            return await models_1.default.transaction(async (t) => {
                await index_service_1.CourseService.editCourseUser({
                    currentLessonId: leastOrderLesson.id,
                    is_started: true,
                }, { where: { userId: user === null || user === void 0 ? void 0 : user.id, courseId: course_id }, transaction: t });
                await index_service_1.LessonService.editLessonUser({ is_started: true }, {
                    where: { lessonId: leastOrderLesson.id, userId: user === null || user === void 0 ? void 0 : user.id },
                    transaction: t,
                });
                const filter = {
                    where: { id: course_id },
                    include: [
                        {
                            model: lesson_model_1.Lesson,
                            as: "lessons",
                        },
                    ],
                    order: [
                        [{ model: lesson_model_1.Lesson, as: "lessons" }, "order", "ASC"],
                        [{ model: lesson_model_1.Lesson, as: "lessons" }, "createdAt", "ASC"],
                    ],
                    transaction: t,
                };
                const result = await index_service_1.CourseService.fetchCourse(filter);
                if (!result)
                    return res.json(result);
                const [mapped_result] = await (0, common_1.mapCourseImage)([result]);
                return res.json(mapped_result);
            });
        }
        catch (err) {
            next(err);
        }
    },
    getLoggedUserCoursesWithProgress: async (req, res, next) => {
        try {
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user not exist", 400);
            }
            const user_courses = await index_service_1.ExerciseService.getCoursesWithProgress({
                where: { userId: user.id },
            });
            return res.json(user_courses);
        }
        catch (err) {
            next(err);
        }
    },
    getUserCoursesInfo: async (req, res, next) => {
        try {
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user does not exist", 403);
            }
            const user_courses = await index_service_1.ExerciseService.getCoursesInfo({
                where: { userId: user.id },
                order: [
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: lesson_model_1.Lesson, as: "lesson" },
                        "order",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: lesson_model_1.Lesson, as: "lesson" },
                        "createdAt",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: exercise_user_model_1.Exercise_User, as: "exercise_users" },
                        { model: exercise_model_1.Exercise, as: "exercise" },
                        "order",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: exercise_user_model_1.Exercise_User, as: "exercise_users" },
                        { model: exercise_model_1.Exercise, as: "exercise" },
                        "createdAt",
                        "ASC",
                    ],
                ],
            });
            return res.json((0, common_1.mapCourseUserInfo)(user_courses));
        }
        catch (err) {
            next(err);
        }
    },
    getLoggedUserCourseWithProgress: async (req, res, next) => {
        try {
            const { course_id } = req.params;
            const { error } = user_validation_1.courseToLoggedUserSchema.validate({
                course_id,
            });
            if (error) {
                (0, handleError_1.handleError)(error.message, 404);
            }
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user not exist", 404);
            }
            const user_course = await index_service_1.ExerciseService.getCoursesWithProgress({
                where: { userId: user.id, courseId: course_id },
            });
            if (user_course.length == 0) {
                return (0, handleError_1.handleError)("Course progress for the user not found", 404);
            }
            return res.json(user_course[0]);
        }
        catch (err) {
            next(err);
        }
    },
    getUserCourseInfo: async (req, res, next) => {
        try {
            const { course_id } = req.params;
            const { error } = user_validation_1.courseToLoggedUserSchema.validate({
                course_id,
            });
            if (error) {
                (0, handleError_1.handleError)(error.message, 404);
            }
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("user does not exist", 404);
            }
            const user_courses = await index_service_1.ExerciseService.getCoursesInfo({
                where: { userId: user.id, courseId: course_id },
                order: [
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: lesson_model_1.Lesson, as: "lesson" },
                        "order",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: lesson_model_1.Lesson, as: "lesson" },
                        "createdAt",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: exercise_user_model_1.Exercise_User, as: "exercise_users" },
                        { model: exercise_model_1.Exercise, as: "exercise" },
                        "order",
                        "ASC",
                    ],
                    [
                        { model: lesson_user_model_1.Lesson_User, as: "lesson_users" },
                        { model: exercise_user_model_1.Exercise_User, as: "exercise_users" },
                        { model: exercise_model_1.Exercise, as: "exercise" },
                        "createdAt",
                        "ASC",
                    ],
                ],
            });
            if (user_courses.length < 1) {
                (0, handleError_1.handleError)("course not found", 404);
            }
            const [user_course] = (0, common_1.mapCourseUserInfo)(user_courses);
            return res.json(user_course);
        }
        catch (err) {
            next(err);
        }
    },
    getUserExerciseInfo: async (req, res, next) => {
        try {
            const { lesson_id } = req.params;
            const { error } = user_validation_1.lessonIdSchema.validate({
                lesson_id,
            });
            if (error) {
                (0, handleError_1.handleError)(error.message, 400);
            }
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("User does not exist", 404);
            }
            const lesson_user = await index_service_1.LessonService.fetchLessonUser(user.id, lesson_id);
            if (!lesson_user) {
                return (0, handleError_1.handleError)("The given lesson not found", 404);
            }
            const exercises_info = await index_service_1.ExerciseService.fetchExercises({
                order: [
                    ["order", "ASC"],
                    ["createdAt", "ASC"],
                ],
                include: [
                    {
                        model: exercise_user_model_1.Exercise_User,
                        where: {
                            userId: user.id,
                            lessonUserId: lesson_user.id,
                        },
                    },
                    {
                        model: step_validation_model_1.StepValidation,
                        attributes: ["type"],
                    },
                ],
            });
            const maped_data = (0, common_1.mapUserExerciseInfo)(exercises_info);
            return res.status(200).json(maped_data);
        }
        catch (err) {
            next(err);
        }
    },
    getUserCollections: async (req, res, next) => {
        try {
            const user = await (0, user_1.getLoggedUser)(req);
            if (!user) {
                return (0, handleError_1.handleError)("User does not exist", 404);
            }
            const filter = {
                include: [
                    {
                        model: course_model_1.Course,
                    },
                ],
            };
            const result = await user.$get("collections", filter);
            const mapped_result = await (0, common_1.mapCollectionCourseImage)(result);
            return res.json(mapped_result);
        }
        catch (error) {
            next(error);
        }
    },
};
