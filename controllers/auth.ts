import passport from 'koa-passport';
import { BasicStrategy } from 'passport-http';
import * as users from '../models/users';

// Password verification function
const verifyPassword = (user: any, password: string) => {
  return user.password === password; // Update this to use bcrypt if passwords are hashed
};

// Basic Strategy for passport
passport.use(new BasicStrategy(async (username, password, done) => {
  try {
    const result = await users.findByUsername(username);
    if (result.length) {
      const user = result[0];
      if (verifyPassword(user, password)) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } else {
      return done(null, false);
    }
  } catch (error) {
    console.error('Error in BasicStrategy:', error);
    return done(error);
  }
}));

// Middleware for authentication
export const basicAuth = async (ctx: any, next: any) => {
  return passport.authenticate('basic', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      ctx.status = 500;
      ctx.body = { message: 'Internal server error' };
      return;
    }

    if (!user) {
      console.log('Authentication failed:', info);
      ctx.status = 401;
      ctx.body = { message: 'You are not authorized' };
      return;
    }

    ctx.state.user = user;
    console.log('Authenticated user:', user);
    return next();
  })(ctx, next);
};
