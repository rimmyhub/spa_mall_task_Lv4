const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Comments } = require("../models");
const authMiddleware = require("../middlewares/auth-middleware");

//댓글 조회
router.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const comments = await Comments.findAll({
    where: { PostId: postId },
    attributes: [
      "commentId",
      "PostId",
      "UserId",
      "comment",
      "createdAt",
      "updatedAt",
    ],
    order: [["createdAt", "DESC"]], // 내림차순 정렬
  });

  return res.status(200).json({ data: comments });
});

// 댓글 작성 : 로그인 토큰을 검사하여, 유효한 토큰일 경우에만 댓글 작성 가능
router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  const { userId } = res.locals.user;
  const { postId } = req.params;
  const { comment } = req.body;

  // 댓글 내용을 비워둔 채 댓글 작성 API를 호출한 경우
  if (!comment) {
    return res.status(400).json({
      success: false,
      message: "댓글 내용을 입력해주세요.",
    });
  }

  try {
    const createdComment = await Comments.create({
      UserId: userId,
      PostId: postId,
      comment,
    });

    // 데이터가 정상적으로 전달되지 못한 경우
    if (!createdComment) {
      return res.status(400).json({
        success: false,
        message: "데이터 형식이 올바르지 않습니다.",
      });
    }

    res
      .status(200)
      .json({ message: "댓글을 작성하였습니다.", comments: createdComment });
  } catch (error) {
    console.error(error);
    res.status(400).json({ errorMessage: "댓글 작성에 실패하였습니다." }); // 예외 케이스에서 처리하지 못한 에러
  }
});

// 댓글 수정
router.put(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { commentId } = req.params;
    const { userId } = res.locals.user;
    const { comment } = req.body;

    // 댓글을 조회합니다.
    const existsComment = await Comments.findOne({ where: { commentId } });

    if (!existsComment) {
      return res.status(404).json({ message: "댓글이 존재하지 않습니다." });
    } else if (existsComment.UserId !== userId) {
      return res
        .status(401)
        .json({ message: "댓글을 수정할 권한이 없습니다." });
    }

    // 댓글의 권한을 확인하고, 게시글을 수정합니다.
    await Comments.update(
      { comment }, // comment 를 수정합니다
      {
        where: {
          [Op.and]: [{ commentId }, { UserId: userId }],
        },
      }
    );

    return res.status(200).json({ data: "댓글을 수정하였습니다." });
  }
);

//댓글 삭제
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { commentId } = req.params;
    const { userId } = res.locals.user;

    // 댓글을 조회합니다.
    const existsComment = await Comments.findOne({
      where: { commentId },
    });

    if (!existsComment) {
      return res.status(404).json({ message: "댓글이 존재하지 않습니다." });
    } else if (existsComment.UserId !== userId) {
      return res
        .status(401)
        .json({ message: "댓글을 삭제할 권한이 없습니다." });
    }

    // 댓글의 권한을 확인하고, 댓글을 삭제합니다.
    await Comments.destroy({
      where: {
        [Op.and]: [{ commentId }, { UserId: userId }],
      },
    });

    return res.status(200).json({ data: "댓글을 삭제하였습니다." });
  }
);

module.exports = router;
