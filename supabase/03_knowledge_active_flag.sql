alter table public.knowledge_documents
  add column if not exists is_active boolean not null default true;

create index if not exists idx_knowledge_documents_active
  on public.knowledge_documents (business_id, is_active);
