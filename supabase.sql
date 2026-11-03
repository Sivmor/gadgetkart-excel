
create table if not exists public.products (
  id text primary key,
  brand text not null,
  category text not null,
  segment text,
  name text not null,
  colors text,
  mrp numeric,
  price numeric not null check (price >= 0),
  cashback numeric,
  net_price numeric,
  bank_name text,
  in_stock boolean not null default false,
  image_url text,
  specifications jsonb not null default '{}'::jsonb,
  offers jsonb not null default '{}'::jsonb
);

alter table public.products enable row level security;

revoke all on public.products from anon, authenticated;
grant all on public.products to service_role;

create or replace function public.replace_products(payload jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  total integer;
begin
  if payload is null
     or jsonb_typeof(payload) <> 'array'
     or jsonb_array_length(payload) = 0 then
    raise exception 'Product list cannot be empty';
  end if;

  delete from public.products;

  insert into public.products (
    id, brand, category, segment, name,
    colors, mrp, price, cashback, net_price,
    bank_name, in_stock, image_url,
    specifications, offers
  )
  select
    p.id, p.brand, p.category, p.segment, p.name,
    p.colors, p.mrp, p.price, p.cashback,
    p.net_price, p.bank_name, p.in_stock,
    p.image_url,
    coalesce(p.specifications, '{}'::jsonb),
    coalesce(p.offers, '{}'::jsonb)
  from jsonb_to_recordset(payload) as p (
    id text,
    brand text,
    category text,
    segment text,
    name text,
    colors text,
    mrp numeric,
    price numeric,
    cashback numeric,
    net_price numeric,
    bank_name text,
    in_stock boolean,
    image_url text,
    specifications jsonb,
    offers jsonb
  );

  get diagnostics total = row_count;
  return total;
end;
$$;

revoke all on function public.replace_products(jsonb)
from public, anon, authenticated;

grant execute on function public.replace_products(jsonb)
to service_role;
