import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import notFound from "./middlewares/not-found.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import vesselRoute from "./routes/vessel.route.js";
import meRoute from "./routes/me.route.js";
import voyageRoute from "./routes/voyage.route.js";
import activityRoute from "./routes/activity.route.js";
import consumptionRoute from "./routes/consumption.route.js";
import fuelConsumptionRoute from "./routes/fuel-consumption.route.js";



dotenv.config();

const app = express();

app.use(cors({
	origin : 'http://localhost:5173',
  credentials: true
}))
app.use(express.json());

app.use("/api/me", meRoute);
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/vessels", vesselRoute);
app.use("/api", voyageRoute);
app.use("/api", activityRoute);
app.use("/api", consumptionRoute);
app.use("/api", fuelConsumptionRoute);


app.use(notFound);
app.use(errorMiddleware);


export default app;
