const express = require("express");
const cookieParser = require("cookie-parser");
const usersRouter = require("./routes/users.route");
const postsRouter = require("./routes/posts.route");
const likessRouter = require("./routes/likes.route");
const commentsRouter = require("./routes/comments.route");

const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/", [usersRouter, postsRouter, likessRouter, commentsRouter]);

app.listen(PORT, () => {
  console.log(PORT, "포트 번호로 서버가 실행되었습니다.");
});
