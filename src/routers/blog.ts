import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'
import { z } from "zod";

const inputBlogBody = z.object({
    title: z.string(), 
    content: z.string(),
})

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    SECRET_KEY: string,
  },
  Variables: {
    user_id: any
  }
}>()

// middleware return user id ans setting it up to the hono Varibales
blogRouter.use('/v1/*', async(c, next)=>{
  const added_token = await c.req.header("Authorization");
  console.log(added_token);
  console.log("working");
  const token: string = added_token?.split(" ")[1] || "";
  console.log(token);
  const isSuccess = await verify(token, c.env.SECRET_KEY) 

  try{
    if(isSuccess){
      c.set("user_id", isSuccess.id);
      await next();
    }else{
      c.status(403);
      return c.json({
          message: "You are not logged in"
      })
    }
  }catch(error){
    c.status(500);
    return c.json({
        message: "error in sever side"
    })
  }
})

// getting user
blogRouter.get('/v1/user', async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL
  }).$extends(withAccelerate())

  try{
    const user = await prisma.user.findUnique({
      where: {
        id: c.get("user_id")
      }
    })

    return c.json({
      msg: user
    })

  }catch(error){
    console.log(error);
    c.status(500);
    return c.json({
        message: "error in sever side"
    })
  }
})

// creating an blog
blogRouter.post("/v1/blog", async(c)=>{
    const body = await c.req.json();
    const isSuccess = inputBlogBody.safeParse(body);

    if(!isSuccess.success){
        c.status(411);
        return c.json({
            message: "Invalid Inputs"
        })
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try{

        const blog = await prisma.post.create({
            data: {
                title: isSuccess.data.title, 
                content: isSuccess.data.content,
                authorId: c.get("user_id")
            }
        })

        return c.json({
            msg: "blog created susccesfully",
            id: blog.id
        })
    }catch(error){
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }

})


blogRouter.get('/v1/blog:id', async(c)=>{
    const id = Number(c.req.param("id"));
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try{

        const blog = await prisma.post.findUnique({
            where: {
                id: id
            }
        })

        if(blog){
            return c.json({
                msg: blog
            })
        }

        c.status(411);
        return c.json({
            message: "blog not found"
        })
    }catch(error){
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }
})


// updating post
blogRouter.put('/v1/blog:id', async(c)=>{
    const body = c.req.json();
    const id = Number(c.req.param('id'));
    const isSuccess = inputBlogBody.safeParse(body);

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    if(!isSuccess.success){
        c.status(411);
        return c.json({
            message: "Invalid Inputs"
        })
    }

    try{
        const blog = await prisma.post.update({
            where: {
                id: id
            },
            data: {
                title: isSuccess.data.title,
                content: isSuccess.data.content,
            }
        })

        return c.json({
            message: "blog updated"
        })
    }catch(error){
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }
})


// delete the blog
blogRouter.delete('/v1/blog:id', async(c)=>{
    const body = c.req.json();
    const id = Number(c.req.param("id"));
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    try{

        const blog = await prisma.post.delete({
            where: {
                id: id
            }
        })

        c.status(411);
        return c.json({
            message: "blog deleted"
        })
    }catch(error){
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }
})



// get all my blogs
blogRouter.get('/v1/my-blogs', async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
        const blogs = await prisma.post.findMany({
            where: {
                authorId: c.get("user_id")
            }
        })

        if(blogs){
            return c.json({
                msg: blogs
            })
        }

        c.status(411);
        return c.json({
            message: "blogs not found"
        })
    }catch(error){
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }
})



// 1. get all blogs
// 2. middleware was not applicable here
blogRouter.get("/getAll", async(c)=>{
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    
    try{
        const blogs = await prisma.post.findMany({
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            }
        })
        console.log(blogs)

        if(blogs.length >= 0){
            return c.json({
                msg: blogs
            })
        }

        c.status(411);
        return c.json({
            message: "blogs not found"
        })
    }catch(error){
        console.log(error)
        c.status(500);
        return c.json({
            message: "error in sever side"
        })
    }
})


