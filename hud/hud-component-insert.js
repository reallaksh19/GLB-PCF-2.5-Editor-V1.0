export async function refreshInsertPreview(ctx, resolver) {
  const res = await resolver.resolveComponent({
    component: ctx.component,
    subtype: ctx.subtype,
    size: ctx.size,
    rating: ctx.rating,
    schedule: ctx.schedule,
  });

  return {
    preview: res?.resolved || null,
    provenance: res?.source || 'manual',
    alternatives: res?.alternatives || [],
  };
}
