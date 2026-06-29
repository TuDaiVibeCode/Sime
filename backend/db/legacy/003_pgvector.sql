create extension if not exists vector;

alter table voice_embeddings
  add column if not exists embedding_vector vector(1536);

create index if not exists voice_embeddings_vector_hnsw_idx
  on voice_embeddings using hnsw (embedding_vector vector_cosine_ops);
