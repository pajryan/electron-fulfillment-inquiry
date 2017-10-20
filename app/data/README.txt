To create data.csv, run the following:


--data.csv
select
	t.name as tenant,
	u.email, "firstName", "lastName", timezone,
	ol."orderId", ol.sku, ol.name, 
	p.type,
	ol."reorderedFromOrderLineId",
	ol."userOptionsValues", ol."userOptionsDefaults", ol."fulfillmentValues", ol.specifications,
	ol."createdAt", ol."completedAt"
from "orderLines" ol
join orders o on o.id = ol."orderId"
join users u on u.id = ol."createdBy"
join tenants t on t.id = o."tenantId"
join products p on p.id = ol."productId"
where ol."createdAt" > '20170801'
and o."deletedAt" is null	-- deletedAt gets set to a value when a user uses dataAudit but then doesn't place the order
order by ol."createdAt" desc


--productData.csv

select
	p.slug,p.type,
	p.specifications
from products p
where p."replacedByProductId" is null

union all

select 
	p1.slug,p2.type,
	p2.specifications
from products p1
left join products p2 on p2.id = p1."replacedByProductId"
where p1."replacedByProductId" is not null



To publish to Windows:
-- but this appears to work:  electron-packager . --platform=win32 --arch=x64 --version=0.0.1