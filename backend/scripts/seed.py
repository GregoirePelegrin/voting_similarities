"""Seed script: generate realistic sample data.

Creates ~12 groups, ~12 categories, ~100 questions, ~700 voters,
and answers with realistic correlated voting patterns.

- Each group gets a latent voting profile (probability of voting Yes per question)
- Individual members draw from their group profile with noise
- Some questions are controversial (near 50/50)
- Answer sparsity: each person has a random response rate (30-80%)
"""

import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from random import Random

import numpy as np
from alembic import command
from alembic.config import Config as AlembicConfig
from app.config import settings
from app.models import (
    Answer,
    Category,
    Commission,
    Group,
    Voter,
    Question,
    Role,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

SEED = 42
NUM_GROUPS = 12
NUM_CATEGORIES = 12
NUM_QUESTIONS = 100
NUM_VOTERS = 700
MIN_RESPONSE_RATE = 0.30
MAX_RESPONSE_RATE = 0.80

CATEGORY_NAMES = [
    "Governance",
    "Ethics",
    "Environment",
    "Technology",
    "Security",
    "Finance",
    "Education",
    "Health",
    "Social Policy",
    "Infrastructure",
    "Innovation",
    "International Relations",
]

GROUP_NAMES = [
    "Alpha Council",
    "Beta Coalition",
    "Gamma Assembly",
    "Delta Forum",
    "Epsilon Syndicate",
    "Zeta Alliance",
    "Eta Collective",
    "Theta Committee",
    "Iota Union",
    "Kappa Society",
    "Lambda Network",
    "Mu Consortium",
]

GROUP_COLORS = [
    "#4E79A7",
    "#F28E2B",
    "#E15759",
    "#76B7B2",
    "#59A14F",
    "#EDC948",
    "#B07AA1",
    "#FF9DA7",
    "#9C755F",
    "#BAB0AC",
    "#86BCB6",
    "#8CD17D",
]

QUESTION_TEMPLATES = [
    "Should {topic} be prioritized in the next strategic plan?",
    "Is the current approach to {topic} sufficient?",
    "Should we increase funding for {topic}?",
    "Should {topic} regulations be strengthened?",
    "Is {topic} a growing concern that needs immediate action?",
    "Should we adopt a new framework for {topic}?",
    "Is the current {topic} policy effective?",
    "Should {topic} be delegated to local authorities?",
    "Is international cooperation needed for {topic}?",
    "Should {topic} be included in the core curriculum?",
]


def reset_schema():
    backend_dir = Path(__file__).resolve().parent.parent
    ini_path = backend_dir / "alembic.ini"
    alembic_cfg = AlembicConfig(str(ini_path))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    alembic_cfg.set_main_option(
        "script_location", str(backend_dir / "migrations")
    )
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")


async def seed_data():
    rng = Random(SEED)
    np_rng = np.random.default_rng(SEED)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        # --- Categories ---
        categories = [Category(name=name) for name in CATEGORY_NAMES]
        session.add_all(categories)
        await session.flush()

        # --- Groups ---
        groups = [Group(name=name, color=GROUP_COLORS[i]) for i, name in enumerate(GROUP_NAMES)]
        session.add_all(groups)
        await session.flush()

        # --- Roles ---
        role_names = ["President", "Vice-president", "Secretaire", "Membre"]
        roles = [Role(name=name) for name in role_names]
        session.add_all(roles)
        await session.flush()

        # --- Commissions ---
        commission_names = [
            "Finance",
            "Ethics",
            "Security",
            "Education",
            "Health",
            "Infrastructure",
        ]
        commissions = [Commission(name=name) for name in commission_names]
        session.add_all(commissions)
        await session.flush()

        # --- Questions ---
        # Each question belongs to 1-3 categories
        questions = []
        for _i in range(NUM_QUESTIONS):
            template = rng.choice(QUESTION_TEMPLATES)
            num_cats = rng.choices([1, 2, 3], weights=[5, 3, 1])[0]
            chosen_cats = rng.sample(categories, num_cats)
            topic = rng.choice([c.name for c in chosen_cats])
            text = template.format(topic=topic)
            q = Question(text=text)
            q.categories = chosen_cats
            questions.append(q)

        session.add_all(questions)
        await session.flush()

        # --- Group latent profiles ---
        # For each group, generate a probability of voting Yes per question.
        # Some groups are more "pro" on certain categories, others more "anti".
        # This creates realistic intra-group similarity.
        group_profiles = np_rng.uniform(0.2, 0.8, size=(NUM_GROUPS, NUM_QUESTIONS))

        # Add category-level bias: each group has a stance per category
        # that shifts all questions in that category
        cat_bias = np_rng.uniform(-0.3, 0.3, size=(NUM_GROUPS, NUM_CATEGORIES))
        for g_idx in range(NUM_GROUPS):
            for q_idx, q in enumerate(questions):
                cat_ids = [c.id for c in q.categories]
                avg_bias = np.mean([cat_bias[g_idx, cid - 1] for cid in cat_ids])
                group_profiles[g_idx, q_idx] = np.clip(
                    group_profiles[g_idx, q_idx] + avg_bias, 0.05, 0.95
                )

        # Make some questions controversial (near 50/50) by centering
        # the group profiles around 0.5 for those questions
        controversial_qs = rng.sample(range(NUM_QUESTIONS), k=int(NUM_QUESTIONS * 0.15))
        for q_idx in controversial_qs:
            group_profiles[:, q_idx] = np.clip(
                group_profiles[:, q_idx] * 0.4 + 0.3, 0.1, 0.9
            )

        # --- People ---
        first_names = [
            "Jean", "Marie", "Pierre", "Sophie", "Luc", "Claire", "Thomas",
            "Isabelle", "Nicolas", "Anne", "Philippe", "Catherine", "Antoine",
            "Julie", "Marc", "Nathalie", "Laurent", "Veronique", "David",
            "Christine", "Francois", "Sandrine", "Michel", "Stephanie",
            "Alexandre", "Emilie", "Bruno", "Helene", "Olivier", "Caroline",
        ]
        last_names = [
            "Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard",
            "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent",
            "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux",
            "Vincent", "Fournier", "Morel", "Girard", "Andre", "Lefevre",
            "Mercier", "Dupont", "Lambert", "Bonnet", "Francois", "Martinez",
        ]

        voters = []
        group_sizes = np_rng.multinomial(
            NUM_VOTERS, [1 / NUM_GROUPS] * NUM_GROUPS
        )
        for g_idx, _group in enumerate(groups):
            for _p_idx in range(group_sizes[g_idx]):
                firstname = rng.choice(first_names)
                lastname = rng.choice(last_names)
                role = rng.choices(roles, weights=[1, 2, 3, 14])[0]
                commission = rng.choice(commissions)
                circonscription = f"Circonscription {rng.randint(1, 20):02d}"
                voter = Voter(
                    firstname=firstname,
                    lastname=lastname,
                    group_id=_group.id,
                    role_id=role.id,
                    commission_id=commission.id,
                    circonscription=circonscription,
                )
                voters.append(voter)

        session.add_all(voters)
        await session.flush()

        # --- Answers ---
        # Each person draws from their group's profile with per-person noise
        # and has a random response rate (sparsity)
        voter_idx = 0
        all_answers = []
        base_date = datetime(2025, 1, 1)

        for g_idx, _group in enumerate(groups):
            for _p_idx in range(group_sizes[g_idx]):
                voter = voters[voter_idx]
                voter_idx += 1

                # Per-voter noise: shift the group profile slightly
                personal_noise = np_rng.normal(0, 0.15, size=NUM_QUESTIONS)
                personal_probs = np.clip(
                    group_profiles[g_idx] + personal_noise, 0.05, 0.95
                )

                # Response rate for this voter
                response_rate = rng.uniform(MIN_RESPONSE_RATE, MAX_RESPONSE_RATE)

                for q_idx, question in enumerate(questions):
                    if rng.random() > response_rate:
                        continue
                    value = bool(np_rng.random() < personal_probs[q_idx])
                    days_offset = rng.randint(0, 365)
                    answered_at = base_date + timedelta(days=days_offset)
                    all_answers.append(
                        Answer(
                            voter_id=voter.id,
                            question_id=question.id,
                            value=value,
                            answered_at=answered_at,
                        )
                    )

        session.add_all(all_answers)
        await session.flush()

        # --- Compute has_passed for each question ---
        from sqlalchemy import func as sa_func

        for q in questions:
            yes_count = (
                await session.execute(
                    select(sa_func.count())
                    .select_from(Answer)
                    .where(Answer.question_id == q.id, Answer.value)
                )
            ).scalar()
            no_count = (
                await session.execute(
                    select(sa_func.count())
                    .select_from(Answer)
                    .where(Answer.question_id == q.id, ~Answer.value)
                )
            ).scalar()
            q.has_passed = (yes_count or 0) > (no_count or 0)

        await session.commit()

        # --- Summary ---
        from sqlalchemy import func

        result = await session.execute(select(func.count()).select_from(Group))
        n_groups = result.scalar()
        result = await session.execute(select(func.count()).select_from(Voter))
        n_voters = result.scalar()
        result = await session.execute(select(func.count()).select_from(Question))
        n_questions = result.scalar()
        result = await session.execute(select(func.count()).select_from(Category))
        n_categories = result.scalar()
        result = await session.execute(select(func.count()).select_from(Answer))
        n_answers = result.scalar()

        print("Seeded database with:")
        print(f"  Groups:    {n_groups}")
        print(f"  Voters:    {n_voters}")
        print(f"  Questions: {n_questions}")
        print(f"  Categories:{n_categories}")
        print(f"  Answers:   {n_answers}")
        print(f"  Avg answers/voter: {n_answers / n_voters:.1f}")
        print(f"  Avg response rate:  {n_answers / (n_voters * n_questions) * 100:.1f}%")

    await engine.dispose()


if __name__ == "__main__":
    reset_schema()
    asyncio.run(seed_data())
