import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, Loader2, XCircle } from 'lucide-react';
import { PrajaCertificateCard } from '../components/common/PrajaCertificateCard';
import { formatIssued, toPrajaCertificate } from '../components/academy/CertificateModal';
import { verifyCertificate, type Certificate } from '../lib/academyApi';

/** Public page (no login): confirms a Civic Academy certificate code is genuine. */
export const CertificateVerifyScreen: React.FC = () => {
  const { code = '' } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    setState('loading');
    verifyCertificate(code)
      .then((c) => {
        setCert(c);
        setState('ok');
      })
      .catch(() => setState('missing'));
  }, [code]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-start justify-center p-4">
      <div className="w-full max-w-xl space-y-4 pt-6">
        <div className="text-center">
          <h1 className="text-lg font-black text-[#0f2d59]">JanSevak Civic Academy</h1>
          <p className="text-xs text-[#64748b]">Certificate verification</p>
        </div>
        {state === 'loading' && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#64748b]" />
          </div>
        )}
        {state === 'missing' && (
          <div className="bg-white rounded-3xl border border-rose-200 p-6 text-center space-y-2">
            <XCircle className="w-9 h-9 text-rose-600 mx-auto" />
            <h2 className="text-sm font-extrabold text-rose-800">No certificate with this ID</h2>
            <p className="text-xs text-[#64748b] break-all">“{code}” was not issued by the Civic Academy. Check the ID and try again.</p>
          </div>
        )}
        {state === 'ok' && cert && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-emerald-900">
              <BadgeCheck className="w-5 h-5 shrink-0" />
              <span>
                <strong>Genuine.</strong> {cert.learner_name} completed “{cert.course_title}” on {formatIssued(cert.completed_at)}. The course was published by {cert.issuer.name}
                {cert.tasks_verified ? ` and ${cert.tasks_verified} task${cert.tasks_verified > 1 ? 's were' : ' was'} checked by them` : ''}.
              </span>
            </div>
            <PrajaCertificateCard certificate={toPrajaCertificate(cert)} userName={cert.learner_name} />
          </>
        )}
        <p className="text-center text-xs">
          <Link to="/" className="text-[#0f2d59] font-bold underline">
            Open JanSevak
          </Link>
        </p>
      </div>
    </div>
  );
};
