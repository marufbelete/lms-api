const express=require('express')
const route=express.Router({ mergeParams: true })
const {addExercise,getExercises,updateExercise,
getExercise,deleteExercise, completeExercise}=require('../controllers/exercise.controller')
const {errorHandler}=require('../middleware/errohandling.middleware')
const { authenticateJWT } = require('../middleware/auth.middleware')
const PATH={
    LESSON_EX:'/lesson/:lesson_id/exercise',
    EXERCISE:'/exercise/:exercise_id'
}
route.post(PATH.LESSON_EX,addExercise,errorHandler)
route.get(PATH.LESSON_EX,getExercises,errorHandler)
route.put(PATH.EXERCISE,updateExercise,errorHandler)
route.get(PATH.EXERCISE,getExercise,errorHandler)
route.delete(PATH.EXERCISE,deleteExercise,errorHandler)

module.exports=route