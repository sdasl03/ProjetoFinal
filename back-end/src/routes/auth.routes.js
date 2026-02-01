import express from "express";
import jwtModule from "jsonwebtoken";
const { sign, verify } = jwtModule;
import User from "../models/User.js";
import config from "../config/env.js";

const router = express.Router();

// Simple response helpers
const successRes = (res, data, message = "Success", status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const errorRes = (res, message = "Error", status = 500, error = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add error details in development
  if (config.server.nodeEnv === "development" && error) {
    response.error = error.message;
  }

  return res.status(status).json(response);
};

// ==================== REGISTER ROUTE ====================
router.post("/register", async (req, res) => {
  try {
    console.log("Registration request:", req.body);

    const {
      full_name,
      email,
      password,
      type,
      department,
      employee_number,
      student_number,
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !type || !department) {
      return errorRes(res, "Campos obrigatórios em falta", 400);
    }

    // Validate type
    if (!["FACULTY", "STUDENT", "ADMIN"].includes(type)) {
      return errorRes(res, "Tipo de utilizador inválido", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorRes(res, "Email já registado", 409);
    }

    // Create user
    const userData = {
      full_name,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      type,
      department,
      active: true,
    };

    // Add role-specific fields
    if (type === "FACULTY" && employee_number) {
      userData.employee_number = employee_number;
    }

    if (type === "STUDENT" && student_number) {
      userData.student_number = student_number;
    }

    const user = new User(userData);

    // Save user
    await user.save();
    console.log("User registered successfully:", user.email);

    // Convert to JSON (password will be removed by toJSON method)
    const userResponse = user.toJSON();

    return successRes(
      res,
      { user: userResponse },
      "Utilizador registado com sucesso",
      201,
    );
  } catch (error) {
    console.error("Registration error details:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorRes(res, "Email ou número já registado", 409);
    }

    // Handle validation error
    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return errorRes(res, "Erro de validação", 400, { errors });
    }

    // Generic error
    return errorRes(res, "Erro no registo", 500, error);
  }
});
// ==================== LOGIN ROUTE ====================
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt:", req.body.email);

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return errorRes(res, "Email e password são obrigatórios", 400);
    }

    // Find user by email
    // Note: We need to explicitly select password since it's not selected by default
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    ); // Include password field

    if (!user) {
      console.log("User not found:", email);
      return errorRes(res, "Credenciais inválidas", 401);
    }

    // Check if account is active
    if (!user.active) {
      return errorRes(res, "Conta desativada. Contacte o administrador.", 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return errorRes(res, "Credenciais inválidas", 401);
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const token = sign(
      {
        userId: user._id,
        email: user.email,
        type: user.type,
        full_name: user.full_name,
      },
      config.auth.jwtSecret,
      {
        expiresIn: config.auth.jwtExpiresIn,
        issuer: "final-projects-api",
        audience: "users",
      },
    );
    // Add this debug code before line 171:
    console.log("DEBUG JWT VALUES:", {
      jwtSecretExists: !!config.auth.jwtSecret,
      jwtSecretLength: config.auth.jwtSecret?.length,
      jwtExpiresIn: config.auth.jwtExpiresIn,
      jwtExpiresInType: typeof config.auth.jwtExpiresIn,
      jwtExpiresInValue: config.auth.jwtExpiresIn,
      configFull: config.auth,
    });

    // Also check what's in process.env
    console.log("DEBUG ENV VALUES:", {
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_EXPIRES_IN_type: typeof process.env.JWT_EXPIRES_IN,
      JWT_SECRET_exists: !!process.env.JWT_SECRET,
      JWT_SECRET_length: process.env.JWT_SECRET?.length,
    });

    const refreshToken = sign(
      {
        userId: user._id,
        type: "refresh",
      },
      config.auth.refreshTokenSecret,
      {
        expiresIn: config.auth.refreshTokenExpiresIn,
        issuer: "final-projects-api",
        audience: "users",
      },
    );

    // Prepare user response (without password)
    const userResponse = user.toJSON();

    console.log("Login successful for user:", user.email);

    return successRes(
      res,
      {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      },
      "Login bem-sucedido",
    );
  } catch (error) {
    console.error("Login error details:", error);
    return errorRes(res, "Erro no login", 500, error);
  }
});

// ==================== GET CURRENT USER (PROTECTED) ====================
router.get("/me", async (req, res) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorRes(res, "Não autenticado. Token necessário.", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = verify(
        token,
        config.auth.jwtSecret || "fallback-secret-key-change-in-production",
      );
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError.message);

      if (jwtError.name === "TokenExpiredError") {
        return errorRes(res, "Token expirado. Faça login novamente.", 401);
      }

      if (jwtError.name === "JsonWebTokenError") {
        return errorRes(res, "Token inválido.", 401);
      }

      return errorRes(res, "Erro na autenticação", 401);
    }

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorRes(res, "Utilizador não encontrado", 404);
    }

    if (!user.active) {
      return errorRes(res, "Conta desativada", 401);
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter && decoded.iat) {
      const changedTimestamp = parseInt(
        user.changedPasswordAfter.getTime() / 1000,
        10,
      );
      if (changedTimestamp > decoded.iat) {
        return errorRes(
          res,
          "Password alterada recentemente. Faça login novamente.",
          401,
        );
      }
    }

    return successRes(
      res,
      { user: user.toJSON() },
      "Perfil obtido com sucesso",
    );
  } catch (error) {
    console.error("Get me error details:", error);
    return errorRes(res, "Erro ao obter perfil", 500, error);
  }
});

// ==================== LOGOUT ROUTE ====================
router.post("/logout", (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. This endpoint can be used to
    // invalidate refresh tokens if you implement token blacklisting.

    const { refreshToken } = req.body;

    // If you have a refresh token system, you could blacklist it here
    // For now, just acknowledge the logout request

    return successRes(res, {}, "Logout realizado com sucesso");
  } catch (error) {
    console.error("Logout error:", error);
    return errorRes(res, "Erro ao fazer logout", 500, error);
  }
});

// ==================== REFRESH TOKEN ROUTE ====================
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorRes(res, "Refresh token é obrigatório", 400);
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verify(
        refreshToken,
        config.auth.jwtSecret || "fallback-secret-key-change-in-production",
      );
    } catch (jwtError) {
      console.error("Refresh token verification error:", jwtError.message);
      return errorRes(res, "Refresh token inválido ou expirado", 401);
    }

    // Check token type
    if (decoded.type !== "refresh") {
      return errorRes(res, "Tipo de token inválido", 401);
    }

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorRes(res, "Utilizador não encontrado", 404);
    }

    if (!user.active) {
      return errorRes(res, "Conta desativada", 401);
    }

    // Generate new access token
    const newAccessToken = sign(
      {
        userId: user._id,
        email: user.email,
        type: user.type,
        full_name: user.full_name,
      },
      config.auth.jwtSecret,
      {
        expiresIn: config.auth.jwtExpiresIn,
        issuer: "final-projects-api",
        audience: "users",
      },
    );

    // Optionally generate new refresh token (rotate)
    const newRefreshToken = sign(
      {
        userId: user._id,
        type: "refresh",
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
        issuer: "final-projects-api",
        audience: "users",
      },
    );

    return successRes(
      res,
      {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
      },
      "Token atualizado com sucesso",
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return errorRes(res, "Erro ao atualizar token", 500, error);
  }
});

// ==================== HEALTH CHECK ====================
router.get("/health", (req, res) => {
  return successRes(
    res,
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Authentication API",
    },
    "API is running",
  );
});

export default router;
