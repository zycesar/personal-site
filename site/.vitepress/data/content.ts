import { z } from 'zod'

const commonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().date(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
})

export const postSchema = commonSchema.extend({
  category: z.string().min(1),
})

export const projectSchema = commonSchema
  .extend({
    featured: z.boolean().default(false),
    example: z.boolean().default(false),
    exampleLabel: z.string().min(1).optional(),
  })
  .superRefine((project, context) => {
    if (project.example && !project.exampleLabel) {
      context.addIssue({
        code: 'custom',
        path: ['exampleLabel'],
        message: 'exampleLabel is required for example projects',
      })
    }
  })

export type PostMeta = z.infer<typeof postSchema>
export type ProjectMeta = z.infer<typeof projectSchema>

export interface ContentPage {
  url: string
  frontmatter: Record<string, unknown>
  excerpt?: string
}

export function parsePost(input: unknown): PostMeta {
  return postSchema.parse(input)
}

export function parseProject(input: unknown): ProjectMeta {
  return projectSchema.parse(input)
}

export function visibleByDate<T extends ContentPage>(pages: T[]): T[] {
  return pages
    .filter(({ frontmatter }) => frontmatter.draft !== true)
    .sort((left, right) =>
      String(right.frontmatter.date).localeCompare(String(left.frontmatter.date)),
    )
}
