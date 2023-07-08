const express = require("express");
const router = express.Router();
const { Op, Sequelize } = require("sequelize");
const { Posts, Likes } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware");

const sequelize = new Sequelize("database", "username", "password", {
  dialect: "sqlite",
  storage: "path/to/database.sqlite",
});

//게시글 전체 조회 (좋아요 갯수 포함)
router.get("/posts", async (req, res) => {
  try {
    const posts = await Posts.findAll({
      attributes: [
        "postId",
        "userId",
        "title",
        "createdAt",
        "updatedAt",
        [
          sequelize.literal(
            "(SELECT COUNT(*) FROM Likes WHERE Likes.PostId = Posts.postId)"
          ),
          "likeCount",
        ],
      ],
      order: [["likeCount", "DESC"]],
    });

    return res.status(200).json({ data: posts });
  } catch (error) {
    console.error("오류가 발생했습니다.", error);
    res.status(500).json({ message: "오류가 발생했습니다." });
  }
});

// 게시글 상세 조회
router.get("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  const post = await Posts.findOne({
    attributes: [
      "postId",
      "userId",
      "title",
      "content",
      "createdAt",
      "updatedAt",
    ],
    where: { postId },
  });

  return res.status(200).json({ data: post });
});

// 게시글 생성
router.post("/posts", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId, title, content } = req.body;

  const post = await Posts.create({
    postId,
    UserId: userId,
    title,
    content,
  });

  return res
    .status(201)
    .json({ message: "게시글 작성에 성공하였습니다.", data: post });
});

// 게시글 수정
router.put("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;
  const { title, content } = req.body;

  // 게시글을 조회합니다.
  const post = await Posts.findOne({ where: { postId } });

  if (!post) {
    return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: "권한이 없습니다." });
  }

  // 게시글의 권한을 확인하고, 게시글을 수정합니다.
  await Posts.update(
    { title, content }, // title과 content 컬럼을 수정합니다.
    {
      where: {
        [Op.and]: [{ postId }, { UserId: userId }],
      },
    }
  );

  return res.status(200).json({ data: "게시글을 수정하였습니다." });
});

// 게시글 삭제
router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { userId } = res.locals.user;

  // 게시글을 조회합니다.
  const post = await Posts.findOne({ where: { postId } });

  if (!post) {
    return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
  } else if (post.UserId !== userId) {
    return res.status(401).json({ message: "권한이 없습니다." });
  }

  // 게시글의 권한을 확인하고, 게시글을 삭제합니다.
  await Posts.destroy({
    where: {
      [Op.and]: [{ postId }, { UserId: userId }],
    },
  });

  return res.status(200).json({ data: "게시글을 삭제하였습니다." });
});

module.exports = router;
