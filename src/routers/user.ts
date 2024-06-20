import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { hashSync } from "bcrypt-ts"
import { z } from "zod";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        SECRET_KEY: string;
    }
}>()

const signUpInput = z.object({
    username: z.string(),
    email: z.string().email(),
    password: z.string().length(6),
})

const signInInput = z.object({
    email: z.string().email(),
    password: z.string().length(6),
})


userRouter.post('/signup', async(c)=>{
    
    const body = await c.req.json();
    console.log(body);
    const isSuccess = signUpInput.safeParse(body);

    // 1. prisma direct acts with accelrated url
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    console.log(isSuccess);
    if(!isSuccess.success){
        c.status(411)
        return c.json({
            msg: "Invalid Credentials"
        })
    }

    try{
        const user = await prisma.user.findUnique({
            where: {
                email: isSuccess.data.email
            }
        })

        if(user){
            c.status(411)
            return c.json({
                msg: "email already exists"
            })
        }

        // const image = await c.env.MY_BUCKET.put("profile", isSuccess.data.image);
        const hashedPassword = await hashSync(isSuccess.data.password, 8);
        const new_user = await prisma.user.create({
            data: {
                username: isSuccess.data.username,
                email: isSuccess.data.email,
                password: hashedPassword
            }
        })

        const id = new_user.id;
        console.log(c.env.SECRET_KEY);
        const token = await sign({
            id: id,
            exp: Math.floor(Date.now() / 1000) + 60 * 60
        }, c.env.SECRET_KEY);

        return c.json({
            msg: "user logged in susscessfully",
            token: token
        })

    }catch(error){
        console.log(error);
        c.status(500);
        return c.json({
            msg: "error in server side"
        })
    }
})


userRouter.post('/signin', async(c)=>{
    
    const body = await c.req.json();
    const isSuccess = signInInput.safeParse(body);

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

    if(!isSuccess.success){
        c.status(411)
        return c.json({
            msg: "Invalid Credentials"
        })
    }

    try{
        const hashedPassword = await hashSync(isSuccess.data.password, 8);
        const user = await prisma.user.findUnique({
            where: {
                email: isSuccess.data.email,
                password: hashedPassword
            }
        })

        if(!user){
            c.status(411)
            return c.json({
                msg: "email not exists"
            })
        }

        const id = user.id;
        const token = await sign({
            id: id,
            exp: Math.floor(Date.now() / 1000) + 60 * 60
        }, c.env.SECRET_KEY);

        return c.json({
            msg: "user signed in susscessfully",
            token: token
        })

    }catch(error){
        c.status(500);
        return c.json({
            msg: "error in server side"
        })
    }

})


// 1. works without any authentication
userRouter.get('/all', async(c)=>{
    
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())
    
    try{
        const users = await prisma.user.findMany({});
        return c.json({
            msg: users
        })
    }catch(error){
        c.status(500);
        return c.json({
            msg: "error in server side"
        })
    }
})