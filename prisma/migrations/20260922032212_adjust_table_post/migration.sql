/*
  Warnings:

  - You are about to drop the `blogs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `posts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `posts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thumbnail` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `posts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "blogs" DROP CONSTRAINT "blogs_authorId_fkey";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "thumbnail" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- DropTable
DROP TABLE "blogs";

-- CreateIndex
CREATE UNIQUE INDEX "posts_title_key" ON "posts"("title");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
