const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
const { Likes } = require("../models");

//좋아요 조회
router.get("/posts/:postId/like", async (req, res) => {
  const likes = await Likes.findAll({
    attributes: ["likeId", "PostId", "UserId", "createdAt", "updatedAt"],
    order: [["createdAt", "DESC"]], // 내림차순 정렬
  });

  return res.status(200).json({ data: likes });
});

//좋아요 만들기
router.post("/posts/:postId/like", authMiddleware, async (req, res) => {
  try {
    const { userId } = res.locals.user;
    const { postId } = req.params;

    const createLike = await Likes.findOne({
      where: { UserId: userId, PostId: postId },
    });
    if (createLike) {
      await createLike.destroy();
      const likeCount = await Likes.count({ where: { PostId: postId } });
      return res
        .status(200)
        .json({ message: "좋아요가 취소되었습니다.", likeCount });
    }

    await Likes.create({ UserId: userId, PostId: postId });
    const likeCount = await Likes.count({ where: { PostId: postId } });
    res.status(200).json({ message: "좋아요가 완료되었습니다.", likeCount });
  } catch (error) {
    res.status(400).json({ message: "좋아요 처리가 실패하였습니다." });
  }
});

module.exports = router;
