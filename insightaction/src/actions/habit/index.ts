'use server'

import { getServerSession } from "next-auth";
import { prisma } from "../../utils/prismaDB";
import { authOptions } from "@/utils/auth";
import { revalidatePath } from "next/cache";

export const createGoal = async (data: {
  title: string;
  description?: string;
  currentPath?: string;
}) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { error: "Unauthorized or insufficient permissions" };
  }

  const { title, description, currentPath } = data;
  const userEmail = session.user.email ;

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail as string },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Create the goal
    const newGoal = await prisma.goal.create({
      data: {
        title,
        description,
        userId: user.id,
      },
    });

    // Revalidate the path if provided, otherwise revalidate the home page
    if (currentPath) {
      revalidatePath(currentPath);
    } else {
      revalidatePath('/');
    }

    return { success: true, goal: newGoal };
  } catch (error: any) {
    return { error: error.message || "Failed to create goal." };
  }
};

interface CreateHabitData {
    title: string;
    description?: string;
    goalId: string;
    cue: string;
    craving: string;
    response: string;
    reward: string;
    implementationIntention: string;
    environment: string;
    time: Date;
    stackedHabitId?: string;
    obstacles?: { description: string; solution: string }[];
    currentPath?: string;
  }
  

  export const createHabit = async (data: CreateHabitData) => {
    const session = await getServerSession(authOptions);
  
    if (!session || !session.user) {
      return { error: "Unauthorized or insufficient permissions" };
    }
  
    const userEmail = session.user.email;
  
    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: userEmail as string},
      });
  
      if (!user) {
        return { error: "User not found" };
      }
  
      // Check if the goal exists and belongs to the user
      const goal = await prisma.goal.findFirst({
        where: {
          id: data.goalId,
          userId: user.id,
        },
      });
  
      if (!goal) {
        return { error: "Goal not found or doesn't belong to the user" };
      }
  
      // Create the habit
      const newHabit = await prisma.habit.create({
        data: {
          title: data.title,
          description: data.description,
          userId: user.id,
          goalId: data.goalId,
          cue: data.cue,
          craving: data.craving,
          response: data.response,
          reward: data.reward,
          implementationIntention: data.implementationIntention,
          environment: data.environment,
          time: data.time,
          stackedHabitId: data.stackedHabitId,
          obstacles: {
            create: data.obstacles?.map(obstacle => ({
              description: obstacle.description,
              solution: obstacle.solution,
            })),
          },
        },
        include: {
          obstacles: true,
        },
      });
  
      // Revalidate the path if provided, otherwise revalidate the home page
      if (data.currentPath) {
        revalidatePath(data.currentPath);
      } else {
        revalidatePath('/');
      }
  
      return { success: true, habit: newHabit };
    } catch (error: any) {
      return { error: error.message || "Failed to create habit." };
    }
  };



