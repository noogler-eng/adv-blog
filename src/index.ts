import { Hono } from 'hono'
import { userRouter } from './routers/user';
import { blogRouter } from './routers/blog';
import { cors } from 'hono/cors'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    SECRET_KEY: string;
  }
}>();

app.use('/*', cors())
app.route('/user/',userRouter);
app.route('/blog/', blogRouter);

export default app
