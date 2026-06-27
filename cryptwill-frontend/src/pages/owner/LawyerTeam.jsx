import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale, Mail, Phone, Building2, Award, Briefcase, MessageCircle, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

function LawyerCard({ member }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background-elevated border border-border rounded-2xl p-6 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
          {member.fullName?.[0] || 'L'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary text-lg">{member.fullName}</h3>
          <p className="text-sm text-brand font-medium">{member.role}</p>
          {member.firmName && (
            <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5" />
              {member.firmName}
            </p>
          )}
        </div>
        <span className="text-xs rounded-full bg-success/10 text-success px-2.5 py-1 font-semibold">
          {member.status === 'ACTIVE' ? 'Available' : member.status}
        </span>
      </div>

      {member.experience && (
        <div className="rounded-xl bg-background border border-border p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Experience
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{member.experience}</p>
        </div>
      )}

      {member.notes && (
        <p className="text-sm text-text-muted italic border-l-2 border-brand/30 pl-3">{member.notes}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-text-muted">
        {member.barNumber && (
          <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 border border-border">
            <Award className="w-3 h-3" />
            {member.barNumber}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <a
          href={`mailto:${member.email}?subject=CryptWill%20Enterprise%20Legal%20Consultation`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand/10 text-brand px-4 py-2.5 text-sm font-semibold hover:bg-brand/20 transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email
        </a>
        {member.phone && (
          <a
            href={`tel:${member.phone.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border text-text-primary px-4 py-2.5 text-sm font-semibold hover:bg-background transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call
          </a>
        )}
        <a
          href={`mailto:${member.email}?subject=CryptWill%20Consultation&body=Hi%20${encodeURIComponent(member.fullName)},%0A%0AI%20would%20like%20to%20discuss%20my%20digital%20estate%20plan.`}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 text-purple-400 px-4 py-2.5 text-sm font-semibold hover:bg-purple-500/10 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contact
        </a>
      </div>
    </motion.div>
  );
}

export default function LawyerTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/lawyers')
      .then(res => setTeam(res.data.data?.team || []))
      .catch(() => toast.error('Failed to load lawyer team'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Scale className="w-6 h-6 text-purple-400" />
              Legal Team
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Your dedicated Enterprise legal counsel for digital estate planning and compliance.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 text-purple-400 px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise Exclusive
          </div>
        </div>
      </motion.div>

      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-sm text-text-secondary">
        Your CryptWill Enterprise plan includes a pre-assigned legal team ready to assist with will documentation,
        tax guidance, and regulatory compliance for your crypto inheritance plan.
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(member => (
          <LawyerCard key={member.id} member={member} />
        ))}
      </div>

      {team.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <Scale className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No lawyer team members yet. They will appear automatically when you upgrade to Enterprise.</p>
        </div>
      )}
    </div>
  );
}
