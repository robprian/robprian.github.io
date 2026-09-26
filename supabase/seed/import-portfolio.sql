begin;

insert into public.profiles (source_key,name,headline,summary,location,email,phone,alternate_email,handle,timezone,is_public)
values ('cv:profile:robby-aprianto','Robby Aprianto','ICT Service Engineer & DevOps Professional','ICT Service Engineer with a strong passion for Linux, cloud, networking, DevOps, and IT infrastructure. Experienced in enterprise system support, service reliability, cloud operations, and infrastructure modernization. Curious about continuous learning and building clean, efficient, reliable systems.','Asia / Jakarta (UTC+7)','robbyaprianto@outlook.co.id','0821-102-1152','robprian@gmail.com','@robrion','UTC+7',true)
on conflict (source_key) do update set name=excluded.name,headline=excluded.headline,summary=excluded.summary,location=excluded.location,email=excluded.email,phone=excluded.phone,alternate_email=excluded.alternate_email,handle=excluded.handle,timezone=excluded.timezone,updated_at=now();

insert into public.social_links (source_key,label,url,sort_order,is_public) values
('cv:social:linkedin','LinkedIn','https://linkedin.com/in/robbyaprianto',1,true),
('cv:social:github','GitHub','https://github.com/robprian',2,true)
on conflict (source_key) do update set label=excluded.label,url=excluded.url,sort_order=excluded.sort_order,updated_at=now();

insert into public.skills (source_key,name,category,icon_slug,sort_order,is_active) values
('cv:skill:rhel','RHEL','Linux','redhat',1,true),('cv:skill:ubuntu','Ubuntu','Linux','ubuntu',2,true),('cv:skill:debian','Debian','Linux','debian',3,true),('cv:skill:suse','SUSE','Linux','suse',4,true),
('cv:skill:aws','AWS','Cloud','amazonaws',10,true),('cv:skill:gcp','GCP','Cloud','googlecloud',11,true),('cv:skill:huawei-cloud','Huawei Cloud','Cloud','huawei',12,true),
('cv:skill:docker','Docker','Containers & Virtualization','docker',20,true),('cv:skill:proxmox','Proxmox','Containers & Virtualization','proxmox',21,true),
('cv:skill:mikrotik','MikroTik','Networking & Infrastructure','mikrotik',30,true),('cv:skill:vpn','VPN','Networking & Infrastructure',null,31,true),('cv:skill:it-infrastructure','IT infrastructure','Networking & Infrastructure',null,32,true),
('cv:skill:grafana','Grafana','Monitoring','grafana',40,true),('cv:skill:prometheus','Prometheus','Monitoring','prometheus',41,true),
('cv:skill:ansible','Ansible','Automation & DevOps','ansible',50,true),('cv:skill:github-actions','GitHub Actions','Automation & DevOps','githubactions',51,true),
('cv:skill:wireshark','Wireshark','Troubleshooting','wireshark',60,true),('cv:skill:ai-prompt-engineering','AI prompt engineering','AI & Productivity',null,70,true)
on conflict (source_key) do update set name=excluded.name,category=excluded.category,icon_slug=excluded.icon_slug,sort_order=excluded.sort_order,is_active=true,updated_at=now();

insert into public.experiences (source_key,role,organization,start_date,end_date,is_current,description,sort_order,is_public) values
('cv:experience:huawei-2026','ICT Service Engineer','PT. Huawei Tech Investment via PT. Elabram Systems','2026-01-01',null,true,'Continuing enterprise system engineering work and production support. Supporting system operations, issue analysis, and service reliability. Contributing to infrastructure improvements and technical coordination.',1,true),
('cv:experience:freelance-devops-2024','Freelance DevOps Engineer','Self-Employed','2024-10-01','2025-11-30',false,'Delivered DevOps consulting for CI/CD pipelines using GitHub Actions. Managed and secured Linux servers on AWS, Hostinger, and Onidel. Implemented Infrastructure as Code practices with Ansible and Docker. Performed performance tuning and security hardening for production systems.',2,true),
('cv:experience:huawei-2020','ICT Service Engineer','PT. Huawei Tech Investment via PT. Elabram Systems','2020-06-01','2024-10-31',false,'Delivered system modernization for Telkomsel and LinkAja. Led change request implementations and upgrades including NGRS v19 to v20. Collaborated with R&D teams to resolve technical issues. Enhanced system features including Dynamic Charging and E-Money Recharge.',3,true),
('cv:experience:indofun-2018','System Engineer','PT. Indofun Digital Technology','2018-10-01','2020-05-31',false,'Managed game servers on GCP, AWS, and Huawei Cloud. Maintained internal VPNs and office network infrastructure using MikroTik. Ensured system stability and infrastructure reliability.',4,true),
('cv:experience:mora-2018','NOC Support Engineer','PT. Mora Telematika Indonesia','2018-01-01','2018-10-31',false,'Monitored backbone networks to detect service disruptions. Reported problems and coordinated with field operations teams.',5,true)
on conflict (source_key) do update set role=excluded.role,organization=excluded.organization,start_date=excluded.start_date,end_date=excluded.end_date,is_current=excluded.is_current,description=excluded.description,sort_order=excluded.sort_order,updated_at=now();

insert into public.education (source_key,institution,credential,start_date,end_date,description,sort_order,is_public) values
('cv:education:stmik-akakom','STMIK AKAKOM Yogyakarta','Bachelor of IT','2013-01-01','2017-12-31','Developed a strong interest in software development and network infrastructure during studies.',1,true),
('cv:education:smk-negeri-1-cilacap','SMK Negeri 1 Cilacap','Vocational High School','2010-01-01','2013-12-31','Built the foundation of an IT career through early exposure to computer networking.',2,true)
on conflict (source_key) do update set institution=excluded.institution,credential=excluded.credential,start_date=excluded.start_date,end_date=excluded.end_date,description=excluded.description,sort_order=excluded.sort_order,updated_at=now();

insert into public.interests (source_key,name,sort_order,is_public) values
('cv:interest:server-virtualization','Server Virtualization',1,true),('cv:interest:networking-iot','Networking and IoT',2,true),('cv:interest:pc-building','PC Building',3,true),('cv:interest:technology-learning','Technology Learning',4,true),('cv:interest:cloud-architecture','Cloud Architecture',5,true)
on conflict (source_key) do update set name=excluded.name,sort_order=excluded.sort_order,updated_at=now();

insert into public.posts_metadata (user_id,source_key,slug,title,excerpt,status,github_path,content,tags,published_at)
select u.id,'jekyll:_posts/2025-04-10-deploy-linux-app-di-flyio.md','deploy-linux-app-di-flyio','Deploy Linux App di Fly.io','Panduan deploy aplikasi Linux berbasis Node.js dan PHP ke Fly.io.','PUBLISHED','_posts/2025-04-10-deploy-linux-app-di-flyio.md',E'Fly.io adalah platform cloud yang memungkinkan kamu menjalankan aplikasi di edge (dekat dengan user).\nDalam panduan ini, kita akan deploy Linux App berbasis Node.js & PHP ke Fly.io dengan langkah sederhana.\n\n### Langkah-langkah:\n\n1. Install Fly CLI\n```bash\ncurl -L https://fly.io/install.sh | sh\n```\n\n2. Buat `fly.toml` dan jalankan:\n```bash\nfly launch\n```\n\n3. Deploy dengan:\n```bash\nfly deploy\n```\n\nDone! Aplikasimu sekarang live di edge.','{}','2025-04-10 10:00:00+07'::timestamptz
from auth.users u where lower(u.email)='robprian@gmail.com'
on conflict (slug) do update set source_key=excluded.source_key,title=excluded.title,excerpt=excluded.excerpt,status='PUBLISHED',github_path=excluded.github_path,content=excluded.content,tags=excluded.tags,published_at=excluded.published_at,updated_at=now();

commit;
