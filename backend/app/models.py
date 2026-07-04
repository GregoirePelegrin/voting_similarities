from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


vote_category = Table(
    "vote_category",
    Base.metadata,
    Column("vote_id", Integer, ForeignKey("votes.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)
    color = Column(String(7), nullable=False)

    members = relationship("Voter", back_populates="group")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)

    members = relationship("Voter", back_populates="role")


class Commission(Base):
    __tablename__ = "commissions"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)

    members = relationship("Voter", back_populates="commission")


class Voter(Base):
    __tablename__ = "voters"

    id = Column(Integer, primary_key=True)
    firstname = Column(String(100), nullable=False)
    lastname = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    commission_id = Column(Integer, ForeignKey("commissions.id"), nullable=True)
    circonscription = Column(String(200), nullable=True)

    group = relationship("Group", back_populates="members")
    role = relationship("Role", back_populates="members")
    commission = relationship("Commission", back_populates="members")
    answers = relationship("Answer", back_populates="voter")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False, unique=True)

    votes = relationship("Vote", secondary=vote_category, back_populates="categories")


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True)
    text = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    has_passed = Column(Boolean, nullable=False, default=False)

    categories = relationship("Category", secondary=vote_category, back_populates="votes")
    answers = relationship("Answer", back_populates="vote")


class Answer(Base):
    __tablename__ = "answers"

    voter_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    vote_id = Column(Integer, ForeignKey("votes.id"), primary_key=True)
    value = Column(Boolean, nullable=False)
    answered = Column(Boolean, nullable=False, default=True)
    present = Column(Boolean, nullable=False, default=True)
    answered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    voter = relationship("Voter", back_populates="answers")
    vote = relationship("Vote", back_populates="answers")


class VoterVoterSim(Base):
    __tablename__ = "voter_voter_similarity"

    voter_a_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    voter_b_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    raw_similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)
    per_category_shared = Column(JSON, nullable=True)


class VoterGroupSim(Base):
    __tablename__ = "voter_group_similarity"

    voter_id = Column(Integer, ForeignKey("voters.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)
    per_category_shared = Column(JSON, nullable=True)


class GroupGroupSim(Base):
    __tablename__ = "group_group_similarity"

    group_a_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    group_b_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    similarity = Column(Float, nullable=False)
    shared_count = Column(Integer, nullable=False, default=0)
    confidence = Column(Float, nullable=False, default=0.0)
    per_category = Column(JSON, nullable=True)


class GroupCohesivity(Base):
    __tablename__ = "group_cohesivity"

    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)
    cohesivity = Column(Float, nullable=False)
    per_category = Column(JSON, nullable=True)


class VoterEmbedding(Base):
    __tablename__ = "voter_embedding"

    id = Column(Integer, primary_key=True, autoincrement=True)
    voter_id = Column(Integer, ForeignKey("voters.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    categories_key = Column(String(50), nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    stress = Column(Float, nullable=False)


class GroupEmbedding(Base):
    __tablename__ = "group_embedding"

    id = Column(Integer, primary_key=True, autoincrement=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    categories_key = Column(String(50), nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    stress = Column(Float, nullable=False)


class CategoryDiscriminativeness(Base):
    __tablename__ = "category_discriminativeness"

    category_id = Column(Integer, ForeignKey("categories.id"), primary_key=True)
    info_gain = Column(Float, nullable=False)
    normalized_ig = Column(Float, nullable=False)
    variance_score = Column(Float, nullable=False)
    per_group_breakdown = Column(JSON, nullable=True)


class ComputationMeta(Base):
    __tablename__ = "computation_meta"

    id = Column(Integer, primary_key=True, autoincrement=True)
    computed_at = Column(DateTime(timezone=True), nullable=False)
    n_voters = Column(Integer, nullable=False)
    n_votes = Column(Integer, nullable=False)
    n_groups = Column(Integer, nullable=False)
    n_categories = Column(Integer, nullable=False)
    global_mean_similarity = Column(Float, nullable=True)
    voter_voter_pairs = Column(Integer, nullable=False)
    group_group_pairs = Column(Integer, nullable=False)
    params = Column(JSON, nullable=True)
