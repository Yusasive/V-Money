const express = require("express");
const cors = require("cors");

const app = express();

// Your allowed origins
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://vmonieweb.com",
    "https://www.vmonieweb.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach routes
app.use("/auth", require("../routes/auth"));
app.use("/content", require("../routes/content"));
app.use("/forms", require("../routes/forms"));
app.use("/upload", require("../routes/upload"));

module.exports = async (req, res) => {
  // Manually handle CORS in case Express doesn't kick in
  res.setHeader(
    "Access-Control-Allow-Origin",
    corsOptions.origin.includes(req.headers.origin)
      ? req.headers.origin
      : "http://localhost:3000"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight handled
  }

  app(req, res);
};
