import { useEffect, useRef } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { frontmatterSchema } from "@/lib/schemas/frontmatter-schema"
import type { SkillFrontmatter } from "@/types/skill"
import { Form } from "@/components/ui/form"
import { BasicInfoSection } from "./basic-info-section"
import { TriggerSection } from "./trigger-section"
import { RuntimeSection } from "./runtime-section"
import { EnvVarsSection } from "./env-vars-section"
import { InstallSection } from "./install-section"
import { UnknownFieldsSection } from "./unknown-fields-section"

interface FrontmatterFormProps {
  frontmatter: SkillFrontmatter
  skillId: string
  onChange: (updated: SkillFrontmatter) => void
}

export function FrontmatterForm({ frontmatter, skillId, onChange }: FrontmatterFormProps) {
  const isResettingRef = useRef(false)

  const form = useForm<SkillFrontmatter>({
    defaultValues: {
      ...frontmatter,
      env: frontmatter.env ?? [],
    },
    resolver: zodResolver(frontmatterSchema) as Resolver<SkillFrontmatter>,
    mode: "onChange",
  })

  // Sync form changes to parent
  useEffect(() => {
    const sub = form.watch((value) => {
      if (!isResettingRef.current) {
        onChange(value as SkillFrontmatter)
      }
    })
    return () => sub.unsubscribe()
  }, [form, onChange])

  // Reset when switching skills
  const prevSkillIdRef = useRef(skillId)
  useEffect(() => {
    if (prevSkillIdRef.current !== skillId) {
      isResettingRef.current = true
      form.reset({
        ...frontmatter,
        env: frontmatter.env ?? [],
      })
      prevSkillIdRef.current = skillId
      requestAnimationFrame(() => {
        isResettingRef.current = false
      })
    }
  }, [skillId, frontmatter, form])

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <BasicInfoSection />
        <TriggerSection />
        <RuntimeSection />
        <EnvVarsSection />
        <InstallSection />
        <UnknownFieldsSection />
      </form>
    </Form>
  )
}
