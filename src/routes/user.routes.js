// import {Router} from "express";
// import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
// import {upload} from "../middlewares/multer.middleware.js";
// import { verifyJWT } from "../middlewares/auth.js";



// const router = Router()

// // router.route("/register").post(registerUser)
// // router.route("/login").post(login)


// router.route("/register").post(
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1
//         }, 
//         {
//             name: "coverImage",
//             maxCount: 1
//         }
//     ]),
//     registerUser
// )


// router.route("/login").post(loginUser)


// // // // secured tokens
// router.route("/logout").post(verifyJWT, logoutUser)

 
// export default router


import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 }, 
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

export default router;
