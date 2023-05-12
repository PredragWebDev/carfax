const router = require('express').Router();

router.use("/selly", require("./selly"));
router.use("/shoppy", require("./shoppy"));


module.exports = router;
