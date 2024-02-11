import { Router } from "express";
import {gettAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus} from '../controllers/video.controller.js'
import {upload} from '../middlewares/multer.middlewares.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


router.route("/").get(gettAllVideos).post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name : "coverImage",
            maxCount: 1
        }
    ]),
    publishAVideo
)
router.route("/search").get(getVideoById)
router.route("/update-video").patch(verifyJWT, upload.single("thumbnail") , updateVideo)
router.route("/delete-video").patch(verifyJWT, deleteVideo)
router.route("/toggle/publish/:videoId").patch( togglePublishStatus);
export default router