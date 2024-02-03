// require('dotenv').config({path:'../env'})
import dotenv from 'dotenv';
import connectDB from './db/db.js';
import { app } from './app.js';



dotenv.config({
    path: './.env'
});

// const app = express(); // Create an Express app instance


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log( `Server is running at port : ${process.env.PORT}`);
    }
    )
    app.on("error", (error) => {
        console.log("ERROR: ", err)
        throw error
    })
    
})
.catch((err) => {
    console.log("MANGO DB connection failed !!!", err);
})