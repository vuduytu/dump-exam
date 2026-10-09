# ECO PgMP mới nhất

Tra cứu ngày 2026-10-09 cho ticket 03. Taxonomy trong `data/tasks.json` (`certification: "PgMP"`) lấy từ file này.

## Kết luận

- ECO PgMP hiện hành là **PMI PgMP® Examination Content Outline – March 2024**. PMI chỉ rà soát nhẹ cho khớp thuật ngữ của *The Standard for Program Management* 5th ed. Lần này PMI không làm job-task analysis mới, và đề thi tiếp tục theo ECO này (trích phần Introduction của ECO).
- ECO có 5 Domain và 72 Task. Số Task và thứ tự đánh số Task trùng với ECO April 2011, chỉ khác câu chữ và tên Domain. Vì vậy 450 nhãn cũ "Domain X / Task N" (theo ECO 2011) đổi thẳng được sang mã mới.
- Đề thi: 170 câu (150 câu tính điểm, 20 câu pretest), 240 phút (PgMP Handbook, bản sửa 11/3/2024).

| # | Domain (tên dùng trong app) | Tỉ trọng | Số Task | Mã Task |
|---|---|---|---|---|
| I | Strategic Program Alignment | 15% | 11 | `strategy-1..11` |
| II | Program Life Cycle Management | 44% | 35 | `lifecycle-1..35` |
| III | Benefits Management | 11% | 8 | `benefits-1..8` |
| IV | Stakeholder Engagement | 16% | 7 | `stakeholder-1..7` |
| V | Governance | 14% | 11 | `governance-1..11` |

## Nguồn

1. PMI, *PgMP Examination Content Outline*, March 2024 (PDF trên pmi.org): https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/pgmp-exam-content-outline.pdf. Đã tải về và đối chiếu: nội dung chữ trùng khớp với file chủ dự án có sẵn `/Volumes/TuVD_Data/Study/PgMP/PgMP-ECO.pdf`, chỉ khác ký hiệu đầu dòng.
2. PMI, *PgMP Certification Handbook*, revised 11 March 2024: https://www.pmi.org/-/media/pmi/documents/public/pdf/certifications/program-management-professional-handbook.pdf. Bảng "PgMP Exam Blueprint" có cùng tỉ trọng nhưng vẫn ghi tên Domain kiểu 2011.
3. PMI, *PgMP Examination Content Outline*, April 2011 (file cũ `/Volumes/TuVD_Data/Study/PgMP/PgMP ECO Old.pdf`). Chỉ dùng để đối chiếu đánh số Task.

## Điểm chưa chắc chắn

- **Có ECO mới hơn March 2024 hay không:** trang https://www.pmi.org/certifications/program-management-pgmp trả về HTTP 403 nên không đọc được. Tìm kiếm web (10/2026) không thấy PMI thông báo ECO PgMP mới. Đợt đổi đề tháng 7/2026 chỉ áp dụng cho PMP. Tôi không có thông tin dứt khoát rằng không có bản mới hơn.
- **Tên Domain III:** bảng tỉ trọng trong ECO 2024 ghi "Benefits **Alignment**", còn tiêu đề mục lục và phần nội dung ghi "Benefits **Management**". App dùng "Benefits Management" (2 trên 3 chỗ trong ECO và Handbook ghi như vậy).
- **Tên Domain trong Handbook:** Handbook 2024 vẫn ghi "Strategic Program Management", "Program Life Cycle" và "Stakeholder Management" (tên 2011). App dùng tên trong ECO 2024.
- **Tỉ trọng phân pha của Domain II:** ECO 2011 chia Domain II thành Initiating 6%, Planning 11%, Executing 14%, Controlling 10% và Closing 3%. ECO 2024 không còn chia như vậy. App không dùng phân pha.
- **Tên Task rút gọn:** ECO chỉ có câu mô tả Task dài. Cột `name` trong `data/tasks.json` là tên rút gọn do tôi tự đặt để hiển thị, không phải tên chính thức. Câu đầy đủ nằm ở mục dưới.

## Mức khớp với nhãn ECO cũ (chỉ để tham khảo)

Chạy lại: `npx tsx scripts/tags.ts agree`. Lệnh đọc `data/pgmp-question-tags.json` và so với nhãn cũ trong Explanation của 3 file 150 câu (11_16_20, 11_19_40, 11_22_10 AM). Nhãn cũ ghi theo dạng `2.30 Task 30: ...`. Vì ECO 2011 và ECO 2024 đánh số Task giống nhau, số `D.T` đổi thẳng được sang mã mới.

- Trong 450 câu, 425 câu có nhãn cũ. 25 câu còn lại không có dòng "Exam Objectives" mà chỉ có "Lesson/Objective", phần lớn là câu định nghĩa: 40580003, 40580004, 40580017, 40580022, 40580068, 40580082, 40580129, 40580144, 40780010, 40780019, 40780031, 40780038, 40780082, 40780087, 40780094, 40780096, 40930036, 40930052, 40930061, 40930076, 40930077, 40930100, 40930136, 40930141, 40930144.
- Một câu có thể mang nhiều nhãn cũ. Câu được tính là khớp khi nhãn mới trùng một trong các nhãn cũ.
- Khớp Task: **106/425 (24,9%)**.
- Khớp Domain: **304/425 (71,5%)**.
- Phần lớn chỗ lệch nằm giữa các Task gần nhau, ví dụ `lifecycle-28` và `lifecycle-29`, hoặc `strategy-5` và `strategy-6`.

## Danh sách Task (nguyên văn ECO March 2024)

### Domain I – Strategic Program Alignment

- `strategy-1` — Task 1: Perform an initial program assessment by defining the program objectives, requirements, and risks to ensure program alignment with the organization’s strategic plan, objectives, priorities, vision, and mission statement.
- `strategy-2` — Task 2: Establish a high-level road map with milestones and preliminary estimates to obtain initial validation and approval from the executive sponsor.
- `strategy-3` — Task 3: Define the high-level road map and financial framework to set a baseline for program definition, planning, and execution.
- `strategy-4` — Task 4: Define the program mission statement by evaluating the stakeholders’ concerns and expectations to establish program direction.
- `strategy-5` — Task 5: Evaluate the program’s business case to develop, validate, and assess the program objectives, priority, feasibility, readiness, and alignment with the organization’s strategic plan.
- `strategy-6` — Task 6: Analyze the available information about organizational and business strategies, internal and external influences, and program drivers to identify and quantify the benefits that program stakeholders expect to realize using research methods such as market analysis and high-level cost-benefit analysis to develop the preliminary program scope and define the benefits realization plan.
- `strategy-7` — Task 7: Estimate the high-level financial framework and nonfinancial benefits of the program to obtain/maintain funding authorization and drive prioritization of projects within the program.
- `strategy-8` — Task 8: Evaluate program objectives relative to regulatory and legal constraints, social impacts, sustainability, cultural considerations, political climate, and ethical concerns to ensure stakeholder alignment and program deliverability.
- `strategy-9` — Task 9: Obtain organizational leadership approval for the program by presenting the program charter with its high-level costs, milestone schedule, and benefits to receive authorization to initiate the program.
- `strategy-10` — Task 10: Identify and evaluate integration opportunities and needs (for example, human capital and human resource requirements and skill sets, facilities, finance, assets, processes, and systems) within program activities and operational activities to align and integrate benefits within or across the organization.
- `strategy-11` — Task 11: Exploit strategic opportunities for change to maximize the realization of benefits.

### Domain II – Program Life Cycle Management

- `lifecycle-1` — Task 1: Develop the program charter consisting of the program scope, assumptions, constraints, high-level risks, high-level benefits and their realization, timing, key stakeholders, outcomes, resource allocation, and other provisions that tie the program to the business case, thereby enabling strategic alignment using input from all stakeholders to initiate and design program and benefits.
- `lifecycle-2` — Task 2: Translate strategic objectives into high-level program scope statements by negotiating with stakeholders, including sponsors/steering committee, to create a program scope description.
- `lifecycle-3` — Task 3: Develop a program roadmap using the goals and objectives of the program, applicable historical information, and other available resources (for example, work breakdown structure (WBS), scope statements, and benefits realization plan) to align the program with the strategy, and manage the expectations of stakeholders, including sponsors/steering committee.
- `lifecycle-4` — Task 4: Develop a responsibility assignment matrix by identifying and assigning program roles and responsibilities to build the program management core team and differentiate between the program and project resources.
- `lifecycle-5` — Task 5: Define standard measurement criteria, including key performance indicators, for success and review points for all constituent projects/components by analyzing stakeholder expectations and requirements across the constituent projects/components to monitor and control the program.
- `lifecycle-6` — Task 6: Conduct program kick-off with key stakeholders by holding meetings to familiarize the organization with the program and obtain stakeholder buy-in.
- `lifecycle-7` — Task 7: Develop a detailed program scope statement by incorporating the program vision and all internal and external objectives, goals, influences, and variables to facilitate overall planning.
- `lifecycle-8` — Task 8: Develop program WBS to determine, plan, and assign the program tasks and deliverables.
- `lifecycle-9` — Task 9: Establish the program management plan and schedule by integrating plans for constituent projects/components and creating plans for supporting program functions (for example, quality, risk, communication, and resources) to effectively forecast, monitor, and identify variances during program execution.
- `lifecycle-10` — Task 10: Optimize the program management plan by identifying, reviewing, and leveling resource requirements (for example, human resources, materials, equipment, facilities, and finance) to gain efficiencies and maximize productivity/synergies among constituent projects/components.
- `lifecycle-11` — Task 11: Define project/program management information system (PMIS) by selecting tools and processes to share knowledge, intellectual property, and documentation across constituent projects/components to maximize synergies, savings, and benefits realization per the governance framework.
- `lifecycle-12` — Task 12: Identify and manage unresolved project-level issues by establishing a monitoring and escalation mechanism and selecting a course of action consistent with program constraints and objectives to achieve program benefits realization.
- `lifecycle-13` — Task 13: Develop the benefits management plan including benefits integration, transition, and sustainment by defining exit criteria to ensure all administrative, commercial, and contractual obligations are met upon program completion.
- `lifecycle-14` — Task 14: Develop key performance indicators (KPIs) by using decomposition/mapping to manage the program and implement a scope and quality management system within the program.
- `lifecycle-15` — Task 15: Monitor human resources for program and project roles, including subcontractors, and identify opportunities to improve team motivation (for example, develop compensation, incentive, and career alignment plans) and negotiate contracts to meet and/or exceed benefits realization objectives.
- `lifecycle-16` — Task 16: Charter and initiate constituent projects/components by assigning project managers and allocating appropriate resources to achieve program objectives.
- `lifecycle-17` — Task 17: Establish consistency by deploying governance framework, uniform standards, resources, infrastructure, tools, and processes to enable informed program decision-making.
- `lifecycle-18` — Task 18: Establish a communication feedback plan and reporting process to capture lessons learned and the team’s experiences throughout the program.
- `lifecycle-19` — Task 19: Lead human resource functions by training, coaching, mentoring, and recognizing the team to improve team engagement and achieve commitment to the program’s goals.
- `lifecycle-20` — Task 20: Review project managers’ performance in executing the project per the project plan to maximize their contribution to achieving program goals.
- `lifecycle-21` — Task 21: Execute the appropriate program management plans (for example, quality, risk, communication, resourcing) using the tools identified in the planning phase and by auditing the results to ensure the program outcomes are aligned with the strategy and deliver anticipated benefits.
- `lifecycle-22` — Task 22: Consolidate project and program data using predefined program plan reporting tools and methods to monitor and control the program performance and communicate to stakeholders.
- `lifecycle-23` — Task 23: Evaluate the program’s status to monitor and control the program while maintaining current program information.
- `lifecycle-24` — Task 24: Approve closure of constituent projects/components upon completion of defined deliverables to ensure scope is compliant with the functional overview.
- `lifecycle-25` — Task 25: Analyze variances and trends in costs, schedule, quality, and risks by comparing actual and forecast to planned values to identify corrective actions or opportunities.
- `lifecycle-26` — Task 26: Update program plans by incorporating corrective actions to ensure program resources are employed effectively to meet program objectives and deliver program benefits.
- `lifecycle-27` — Task 27: Manage program-level issues (for example, human resource management, financial, technology, scheduling) by identifying and selecting a course of action consistent with program scope, constraints, and objectives to achieve program benefits.
- `lifecycle-28` — Task 28: Manage changes per the change management plan to control scope, quality, schedule, cost, contracts, risks, and rewards to achieve program benefits.
- `lifecycle-29` — Task 29: Conduct impact assessments for program changes and recommend decisions to obtain approval per the governance framework.
- `lifecycle-30` — Task 30: Manage risk per the risk management plan to ensure benefits realization.
- `lifecycle-31` — Task 31: Complete a program performance analysis report by comparing actual values to planned values for scope, quality, cost, schedule, and resource data to determine program performance.
- `lifecycle-32` — Task 32: Conduct program closure within the boundaries of the governance framework.
- `lifecycle-33` — Task 33: Execute the transition and close-out of the program and all constituent projects and/ or components (for example, perform administrative and PMIS program closure, archive program documents and lessons learned, and transfer ongoing activities to the functional organization) to transition program benefits and meet program objectives and/or ongoing operational sustainability.
- `lifecycle-34` — Task 34: Conduct the post-review meetings by presenting the program performance reports to obtain feedback and capture lessons learned.
- `lifecycle-35` — Task 35: Report lessons learned and best practices observed and archive to the knowledge repository to support future programs and organizational improvement.

### Domain III – Benefits Management

- `benefits-1` — Task 1: Develop the benefits realization plan and its measurement criteria to set the baseline for the program and communicate to stakeholders, including sponsors /steering committee.
- `benefits-2` — Task 2: Identify and capture synergies and efficiencies identified throughout the program life cycle to update and communicate the benefits realization plan to stakeholders, including sponsors /steering committee.
- `benefits-3` — Task 3: Develop a sustainment plan that identifies the processes, measures, metrics, and tools necessary for the management of benefits beyond the completion of the program to ensure the continued realization of intended benefits.
- `benefits-4` — Task 4: Monitor the metrics (for example, by forecasting, analyzing variances, developing “what if” scenarios and simulations, and utilizing causal analysis) to take corrective actions in the program and maintain and/or potentially improve benefits realization.
- `benefits-5` — Task 5: Verify that the close, transition, and integration of constituent projects /components and the program meet or exceed the benefit realization criteria to achieve the program’s strategic objectives.
- `benefits-6` — Task 6: Maintain benefits register and record program progress to report the benefit to stakeholders via the communications plan.
- `benefits-7` — Task 7: Analyze and update the benefits realization and sustainment plans for uncertainty, risk identification, risk mitigation, and risk opportunity to determine if corrective actions are necessary and communicate to stakeholders.
- `benefits-8` — Task 8: Develop a transition plan to operations to guarantee the sustainment of products and benefits delivered by the program.

### Domain IV – Stakeholder Engagement

- `stakeholder-1` — Task 1: Identify stakeholders, including sponsors/steering committee, and create the stakeholder matrix to document their position relative to the program.
- `stakeholder-2` — Task 2: Perform stakeholder analysis through historical analysis, personal experience, interviews, knowledge base, review of formal agreements (for example, request for proposal (RFP), request for information (RFI), contracts), and input from other sources to create the stakeholder engagement plan.
- `stakeholder-3` — Task 3: Negotiate the support of stakeholders, including sponsors/steering committee, for the program while setting clear expectations and acceptance criteria (for example, KPIs) for the program benefits to achieve and maintain their alignment with the program objectives.
- `stakeholder-4` — Task 4: Generate and maintain visibility for the program and confirm stakeholder support to achieve the program’s strategic objectives.
- `stakeholder-5` — Task 5: Define and maintain communications adapted to different stakeholders, including sponsors/steering committee, to ensure their support for the program.
- `stakeholder-6` — Task 6: Evaluate risks identified by stakeholders, including sponsors/steering committee, and incorporate them in the program risk management plan, as necessary.
- `stakeholder-7` — Task 7: Develop and foster relationships with stakeholders, including sponsors/steering committee, to improve communication and enhance their support for the program.

### Domain V – Governance

- `governance-1` — Task 1: Develop program and project management standards and structure (governance, tools, finance, and reporting) using industry best practices and organizational standards to drive efficiency and consistency among projects and deliver program objectives.
- `governance-2` — Task 2: Select a governance framework structure including policies, procedures, and standards that conforms program practices with the organization’s governance structure to deliver program objectives consistent with organizational governance requirements.
- `governance-3` — Task 3: Obtain authorization(s) and approval(s) through stage gate reviews by presenting the program status to governance authorities to proceed to the next phase of the program.
- `governance-4` — Task 4: Evaluate key performance indicators (for example, risks, financials, compliance, quality, safety, and stakeholder satisfaction) to monitor benefits throughout the program life cycle.
- `governance-5` — Task 5: Develop and/or utilize the program management information system), and integrate different processes as needed, to manage program information and communicate status to stakeholders.
- `governance-6` — Task 6: Regularly evaluate new and existing risks that impact strategic objectives to present an updated risk management plan to the governance board for approval.
- `governance-7` — Task 7: Establish escalation policies and procedures to ensure risks are handled at the appropriate level.
- `governance-8` — Task 8: Develop and/or contribute to an information repository containing program-related lessons learned, processes, and documentation contributions to support organizational best practices.
- `governance-9` — Task 9: Identify and apply lessons learned to support and influence existing and future programs or organizational improvement.
- `governance-10` — Task 10: Monitor the business environment, program functionality requirements, and benefits realization to ensure the program remains aligned with strategic objectives.
- `governance-11` — Task 11: Develop and support the program integration management plan to ensure operational alignment with program strategic objectives.
