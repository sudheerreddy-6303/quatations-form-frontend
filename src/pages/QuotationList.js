import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

/* ══════════════════════════════════════════════════════════════
   EDIT REQUEST — Manager sends, Admin approves
══════════════════════════════════════════════════════════════ */

function EditRequestModal({ quotation, user, onClose, onSent }) {
  const [reason,   setReason]   = useState('');
  const [sending,  setSending]  = useState(false);
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:18,padding:32,width:460,
        maxWidth:'100%',boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}
        onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <div style={{width:44,height:44,background:'#FFF4F0',borderRadius:12,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
            ✏️
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:'#1a1a1a'}}>Request Edit Permission</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:2}}>
              {quotation.site_name || quotation.customer_name} — Booked Project
            </div>
          </div>
        </div>
        <div style={{background:'#FFF8F5',border:'1px solid rgba(232,71,28,0.2)',
          borderRadius:10,padding:'12px 14px',marginBottom:18,fontSize:13,color:'#92400e'}}>
          🔒 This project is <strong>Booked</strong>. To edit it, please send a request to admin explaining the reason.
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',
            textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>
            Reason for edit *
          </label>
          <textarea
            autoFocus
            placeholder="e.g. Client requested changes to room dimensions, need to update pricing…"
            value={reason}
            onChange={e=>setReason(e.target.value)}
            style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e8e8e8',
              borderRadius:9,fontSize:14,fontFamily:'DM Sans,sans-serif',
              outline:'none',resize:'vertical',minHeight:90,boxSizing:'border-box',
              transition:'border-color 0.2s'}}
            onFocus={e=>e.target.style.borderColor='#E8471C'}
            onBlur={e=>e.target.style.borderColor='#e8e8e8'}
          />
        </div>
        <div style={{display:'flex',gap:10}}>
          <button
            disabled={sending || !reason.trim()}
            onClick={async()=>{
              if (!reason.trim()) { toast.error('Please enter a reason.'); return; }
              setSending(true);
              try {
                await api.post('/edit-requests', {
                  quotation_id: quotation.id,
                  manager_name: user.display || user.username,
                  manager_user: user.username,
                  reason: reason.trim(),
                });
                toast.success('Edit request sent to admin!');
                onSent && onSent();
                onClose();
              } catch (err) {
                toast.error(err?.response?.data?.message || 'Failed to send request.');
              }
              setSending(false);
            }}
            style={{flex:1,padding:'11px',background:'#E8471C',color:'#fff',border:'none',
              borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',
              opacity:sending||!reason.trim()?0.6:1,fontFamily:'DM Sans,sans-serif'}}>
            {sending ? 'Sending…' : '📤 Send Request'}
          </button>
          <button onClick={onClose}
            style={{padding:'11px 18px',background:'#f5f5f5',border:'none',
              borderRadius:10,fontWeight:600,fontSize:14,cursor:'pointer',color:'#666',
              fontFamily:'DM Sans,sans-serif'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Inline completion % bar for table row ── */
// CompletionBar — zero background activity
// Loads ONCE per session when row scrolls into view, never polls
const _cc = {}; // cache: id -> number|'pending'

function CompletionBar({ quotationId }) {
  const [pct, setPct] = React.useState(typeof _cc[quotationId] === 'number' ? _cc[quotationId] : null);
  const ref = React.useRef();

  React.useEffect(() => {
    // Already loaded
    if (typeof _cc[quotationId] === 'number') { setPct(_cc[quotationId]); return; }
    // If pending from a previous mount, clear it so this observer can re-fetch
    if (_cc[quotationId] === 'pending') { delete _cc[quotationId]; }

    // Use IntersectionObserver — only load when row is visible on screen
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      if (_cc[quotationId] === 'pending' || typeof _cc[quotationId] === 'number') return;
      _cc[quotationId] = 'pending';
      api.get('/completion-status/' + quotationId)
        .then(r => {
          const v = r.data.data?.percentage ?? 0;
          _cc[quotationId] = v;
          setPct(v);
        })
        .catch(() => { _cc[quotationId] = 0; setPct(0); });
    }, { threshold: 0 });

    obs.observe(el);
    return () => obs.disconnect();
  }, [quotationId]);

  return (
    <div ref={ref} style={{textAlign:'center',minHeight:24}}>
      {pct === null
        ? <div style={{color:'#ddd',fontSize:10}}>—</div>
        : <>
          <div style={{fontFamily:'monospace',fontWeight:800,fontSize:13,lineHeight:1,
            color:pct>=100?'#15803d':pct>=75?'#10B981':pct>=50?'#F59E0B':pct>0?'#E8471C':'#999'}}>
            {pct}%
          </div>
          <div style={{marginTop:4,height:5,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
            <div style={{height:'100%',width:pct+'%',borderRadius:99,transition:'width 0.6s',
              background:pct>=100?'#15803d':pct>=75?'#10B981':pct>=50?'#F59E0B':pct>0?'#E8471C':'#ccc'}}/>
          </div>
        </>
      }
    </div>
  );
}

function ActionDropdown({ q, canEdit, isManager, isAdmin, canDelete, approvedEdits,
  onView, onEdit, onRequestEdit, onPayment, onDownload, onPrint, onDelete, onProjectMgmt, onVisitReport, onCompletion }) {
  const [open, setOpen]   = React.useState(false);
  const [pos,  setPos]    = React.useState({ top:0, left:0 });
  const btnRef = React.useRef();

  // Close on outside click only (no scroll listener — scroll was causing freezes)
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuW = 185;
      const menuH = 320;
      const isMobile = window.innerWidth <= 768;

      // Vertical: flip up if not enough space below
      const top = rect.bottom + menuH > window.innerHeight
        ? Math.max(8, rect.top - menuH - 4)
        : rect.bottom + 4;

      if (isMobile) {
        // On mobile: center on screen horizontally, or left-align
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuW - 8));
        setPos({ top, left, right: null });
      } else {
        // Desktop: right-align with button
        const right = window.innerWidth - rect.right;
        setPos({ top, right, left: null });
      }
    }
    setOpen(o => !o);
  };

  const isBooked    = (q.project_status || 'Unbooked') === 'Booked';
  const canEditQ    = canEdit(q);
  const showReqEdit = isManager && isBooked && !canEditQ;

  const Item = ({ icon, label, color = '#1a1a1a', onClick, sep }) => (
    <button
      onMouseDown={e => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); setOpen(false); onClick(); }}
      style={{
        display:'flex', alignItems:'center', gap:10,
        width:'100%', padding:'11px 16px', background:'none',
        border:'none', borderTop: sep ? '1px solid #f3f3f3' : 'none',
        cursor:'pointer', textAlign:'left', fontSize:13,
        color, fontFamily:"'DM Sans',sans-serif", fontWeight:500,
        minHeight:44,
      }}
      onMouseEnter={e => e.currentTarget.style.background='#f8f8f8'}
      onMouseLeave={e => e.currentTarget.style.background='none'}
    >
      <span style={{fontSize:15, width:22, textAlign:'center'}}>{icon}</span>
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          display:'inline-flex', alignItems:'center', gap:5,
          padding:'6px 13px',
          background: open ? '#E8471C' : '#fff',
          border:'1.5px solid ' + (open ? '#E8471C' : '#ddd'),
          borderRadius:8, cursor:'pointer', fontSize:13,
          fontWeight:600, color: open ? '#fff' : '#444',
          fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
          whiteSpace:'nowrap', userSelect:'none',
          boxShadow: open ? '0 2px 8px rgba(232,71,28,0.25)' : 'none',
        }}
      >
        Actions
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
          style={{transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition:'transform 0.18s', flexShrink:0}}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>

      {open && ReactDOM.createPortal(
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position:'fixed',
            top: pos.top,
            ...(pos.left  != null ? { left:  pos.left  } : {}),
            ...(pos.right != null ? { right: pos.right } : {}),
            background:'#fff',
            border:'1px solid #e8e8e8',
            borderRadius:12,
            boxShadow:'0 12px 40px rgba(0,0,0,0.18)',
            zIndex:99999,
            minWidth:185,
            maxWidth:'calc(100vw - 16px)',
            overflow:'hidden',
            animation:'ddFadeIn 0.14s ease',
          }}
        >
          <style>{`@keyframes ddFadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}`}</style>
          <Item icon="👁"  label="View"           color="#1D4ED8" onClick={onView} />
          {canEditQ    && <Item icon="✏️" label="Edit"          color="#E8471C" onClick={onEdit} />}
          {showReqEdit && <Item icon="🔓" label="Request Edit"  color="#B45309" onClick={onRequestEdit} />}
          <Item icon="💳"  label="Record Payment"  color="#15803D" onClick={onPayment} />
          {onProjectMgmt && <Item icon="📋" label="Project Mgmt"  color="#0369A1" onClick={onProjectMgmt} />}
          <Item icon="📸" label="Visit Report"   color="#7C3AED" onClick={onVisitReport} />
          <Item icon="📊" label="Completion %"   color="#15803D" onClick={onCompletion} />
          <Item icon="⬇"   label="Download PDF"   color="#374151" onClick={onDownload} sep />
          <Item icon="🖨"   label="Print PDF"      color="#374151" onClick={onPrint} />
          {canDelete   && <Item icon="🗑" label="Delete"        color="#B91C1C" onClick={onDelete} sep />}
        </div>,
        document.body
      )}
    </>
  );
}

/* ══ PAYMENT DELETE REQUEST — Manager sends, Admin approves ══ */

function PaymentDeleteRequestModal({ txn, quotation, user, onClose, onSent }) {
  const [reason,  setReason]  = useState('');
  const [sending, setSending] = useState(false);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:99999,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:18,padding:32,width:460,maxWidth:'100%',
        boxShadow:'0 24px 60px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <div style={{width:44,height:44,background:'#FFF0F0',borderRadius:12,
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🗑️</div>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:'#1a1a1a'}}>Request Payment Deletion</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:2}}>
              {quotation.site_name||quotation.customer_name}
            </div>
          </div>
        </div>

        {/* Payment summary */}
        <div style={{background:'#FFF8F5',border:'1px solid rgba(232,71,28,0.2)',borderRadius:10,
          padding:'12px 14px',marginBottom:16,fontSize:13}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{color:'#888'}}>Stage:</span>
            <span style={{fontWeight:600}}>{txn.stage_name||'Payment'}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{color:'#888'}}>Amount:</span>
            <span style={{fontWeight:700,color:'#E8471C'}}>₹{Number(txn.paid_amount||0).toLocaleString('en-IN')}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'#888'}}>Date:</span>
            <span style={{fontWeight:500}}>{txn.payment_date||'—'}</span>
          </div>
        </div>

        <div style={{background:'#FEF9E6',border:'1px solid #FCD34D',borderRadius:9,
          padding:'10px 14px',marginBottom:16,fontSize:12,color:'#92400e'}}>
          🔒 You cannot delete payments directly. This request will be sent to admin for approval.
        </div>

        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',
            textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>
            Reason for deletion *
          </label>
          <textarea autoFocus
            placeholder="e.g. Wrong amount entered, duplicate entry, client changed payment method…"
            value={reason} onChange={e=>setReason(e.target.value)}
            style={{width:'100%',padding:'10px 13px',border:'1.5px solid #e8e8e8',
              borderRadius:9,fontSize:14,fontFamily:'DM Sans,sans-serif',
              outline:'none',resize:'vertical',minHeight:80,boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#E8471C'}
            onBlur={e=>e.target.style.borderColor='#e8e8e8'}
          />
        </div>

        <div style={{display:'flex',gap:10}}>
          <button
            disabled={sending||!reason.trim()}
            onClick={async()=>{
              if(!reason.trim()){toast.error('Please enter a reason.');return;}
              setSending(true);
              try {
                const { attachment_data, file_data, ...txnClean } = txn;
                await api.post('/payment-delete-requests',{
                  transaction_id: txn.id,
                  quotation_id:   quotation.id,
                  manager_name:   user.display||user.username,
                  manager_user:   user.username,
                  reason:         reason.trim(),
                  txn_snapshot:   txnClean,
                });
                toast.success('Delete request sent to admin!');
                onSent&&onSent();
                onClose();
              } catch(err){
                toast.error(err?.response?.data?.message||'Failed to send request.');
              }
              setSending(false);
            }}
            style={{flex:1,padding:11,background:'#E8471C',color:'#fff',border:'none',
              borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',
              opacity:sending||!reason.trim()?0.6:1,fontFamily:'DM Sans,sans-serif'}}>
            {sending?'Sending…':'📤 Send Delete Request'}
          </button>
          <button onClick={onClose}
            style={{padding:'11px 18px',background:'#f5f5f5',border:'none',
              borderRadius:10,fontWeight:600,fontSize:14,cursor:'pointer',color:'#666'}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPayDeletePanel({ onClose, onActioned }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);
  const [note,     setNote]     = useState({});

  const load = useCallback(()=>{
    setLoading(true);
    api.get('/payment-delete-requests')
      .then(r=>setRequests(r.data.data||[]))
      .catch(()=>toast.error('Failed to load.'))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const respond = async(id, status)=>{
    setActing(id);
    try {
      await api.patch('/payment-delete-requests/'+id, {status, admin_note:note[id]||''});
      toast.success(status==='Approved'?'✅ Approved! Payment deleted.':'❌ Request denied.');
      onActioned&&onActioned();
      load();
    } catch {toast.error('Failed.');}
    setActing(null);
  };

  const pending  = requests.filter(r=>r.status==='Pending');
  const resolved = requests.filter(r=>r.status!=='Pending');

  const SS = {
    Pending:  {bg:'#FEF9E6',color:'#B45309',border:'#FCD34D'},
    Approved: {bg:'#F0FDF4',color:'#15803D',border:'#86EFAC'},
    Denied:   {bg:'#FFF0F0',color:'#B91C1C',border:'#FECACA'},
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:18,width:580,maxWidth:'100%',
        maxHeight:'88vh',display:'flex',flexDirection:'column',
        boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>

        <div style={{padding:'20px 24px',borderBottom:'1px solid #f0f0f0',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:'#1a1a1a',display:'flex',alignItems:'center',gap:8}}>
              🗑️ Payment Delete Requests
              {pending.length>0&&<span style={{background:'#E8471C',color:'#fff',borderRadius:20,
                padding:'2px 9px',fontSize:12,fontWeight:700}}>{pending.length}</span>}
            </div>
            <div style={{fontSize:12,color:'#aaa',marginTop:2}}>Review manager requests to delete payment records</div>
          </div>
          <button onClick={onClose}
            style={{background:'#f5f5f5',border:'none',borderRadius:8,width:32,height:32,
              cursor:'pointer',fontSize:16,color:'#888'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Loading…</div>
          ) : requests.length===0 ? (
            <div style={{textAlign:'center',padding:48}}>
              <div style={{fontSize:36,marginBottom:10}}>📭</div>
              <div style={{fontSize:15,color:'#aaa'}}>No payment delete requests yet.</div>
            </div>
          ) : (
            <>
              {pending.length>0&&(
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:800,color:'#B45309',textTransform:'uppercase',
                    letterSpacing:0.8,marginBottom:10}}>⏳ Pending ({pending.length})</div>
                  {pending.map(r=>{
                    let snap={};try{snap=JSON.parse(r.txn_snapshot||'{}');}catch{}
                    return (
                      <div key={r.id} style={{border:'1.5px solid #FCD34D',borderRadius:12,
                        padding:'14px 16px',marginBottom:12,background:'#FFFBEB'}}>
                        <div style={{marginBottom:10}}>
                          <div style={{fontWeight:700,fontSize:14,color:'#1a1a1a'}}>
                            {r.site_name||r.customer_name}
                          </div>
                          <div style={{fontSize:12,color:'#666',marginTop:3}}>
                            👤 {r.manager_name} · {new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </div>
                        </div>
                        {/* Payment details */}
                        <div style={{background:'#fff',borderRadius:8,padding:'10px 12px',
                          marginBottom:10,border:'1px solid #fde68a',fontSize:12}}>
                          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                            <span><b>Stage:</b> {snap.stage_name||'—'}</span>
                            <span><b>Amount:</b> <span style={{color:'#E8471C',fontWeight:700}}>₹{Number(snap.paid_amount||0).toLocaleString('en-IN')}</span></span>
                            <span><b>Date:</b> {snap.payment_date||'—'}</span>
                            <span><b>By:</b> {snap.received_by||'—'}</span>
                          </div>
                        </div>
                        {r.reason&&(
                          <div style={{padding:'8px 12px',background:'#fff',borderRadius:8,
                            border:'1px solid #fde68a',fontSize:13,color:'#555',
                            fontStyle:'italic',marginBottom:10}}>
                            "{r.reason}"
                          </div>
                        )}
                        <input placeholder="Optional note to manager…"
                          value={note[r.id]||''}
                          onChange={e=>setNote(n=>({...n,[r.id]:e.target.value}))}
                          style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',
                            borderRadius:8,fontSize:13,fontFamily:'DM Sans,sans-serif',
                            outline:'none',boxSizing:'border-box',marginBottom:10}} />
                        <div style={{display:'flex',gap:8}}>
                          <button disabled={acting===r.id} onClick={()=>respond(r.id,'Approved')}
                            style={{flex:1,padding:9,background:'#10B981',color:'#fff',
                              border:'none',borderRadius:8,fontWeight:700,fontSize:13,
                              cursor:'pointer',opacity:acting===r.id?0.7:1}}>
                            ✅ Approve & Delete
                          </button>
                          <button disabled={acting===r.id} onClick={()=>respond(r.id,'Denied')}
                            style={{flex:1,padding:9,background:'#EF4444',color:'#fff',
                              border:'none',borderRadius:8,fontWeight:700,fontSize:13,
                              cursor:'pointer',opacity:acting===r.id?0.7:1}}>
                            ❌ Deny
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {resolved.length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:'#888',textTransform:'uppercase',
                    letterSpacing:0.8,marginBottom:10}}>History ({resolved.length})</div>
                  {resolved.map(r=>{
                    let snap={};try{snap=JSON.parse(r.txn_snapshot||'{}');}catch{}
                    const ss=SS[r.status]||SS.Denied;
                    return (
                      <div key={r.id} style={{border:`1px solid ${ss.border}`,borderRadius:10,
                        padding:'12px 14px',marginBottom:8,background:ss.bg}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a'}}>
                              {r.site_name||r.customer_name}
                              <span style={{marginLeft:8,fontSize:11,color:'#aaa'}}>
                                ₹{Number(snap.paid_amount||0).toLocaleString('en-IN')} · by {r.manager_name}
                              </span>
                            </div>
                            {r.admin_note&&<div style={{fontSize:12,color:'#666',marginTop:3}}>Note: {r.admin_note}</div>}
                          </div>
                          <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                            color:ss.color,background:'rgba(255,255,255,0.7)',border:`1px solid ${ss.border}`}}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   VISIT REPORT MODAL
══════════════════════════════════════════════════════════════ */
function VisitReportModal({ quotation, user, onClose }) {
  const [tab,         setTab]         = React.useState('list'); // 'list'|'add'
  const [reports,     setReports]     = React.useState([]);
  const [loading,     setLoading]     = React.useState(true);
  const [saving,      setSaving]      = React.useState(false);
  const [form,        setForm]        = React.useState({
    visit_date: new Date().toISOString().slice(0,10),
    visit_time: new Date().toTimeString().slice(0,5),
    reported_by: user?.display || user?.username || '',
    notes: '',
  });
  const [files,       setFiles]       = React.useState([]);
  const [fileError,   setFileError]   = React.useState('');
  const [viewFile,    setViewFile]    = React.useState(null);
  const fileRef = React.useRef();

  const load = React.useCallback(() => {
    setLoading(true);
    api.get('/visit-reports', { params: { quotation_id: quotation.id } })
      .then(r => setReports(r.data.data || []))
      .catch(() => toast.error('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, [quotation.id]);

  React.useEffect(() => { load(); }, [load]);

  const handleFileAdd = async (e) => {
    const selected = Array.from(e.target.files);
    setFileError('');
    const readers = await Promise.all(selected.map(f => new Promise((res, rej) => {
      if (f.size > 10 * 1024 * 1024) { rej(new Error(f.name + ' exceeds 10MB')); return; }
      const r = new FileReader();
      r.onload = () => res({ name: f.name, type: f.type, data: r.result });
      r.onerror = rej;
      r.readAsDataURL(f);
    }))).catch(err => { setFileError(err.message); return null; });
    if (readers) setFiles(prev => [...prev, ...readers]);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_,i) => i !== idx));

  const handleSave = async () => {
    if (!form.visit_date) { toast.error('Visit date is required.'); return; }
    if (files.length < 3) { setFileError('Minimum 3 files are required.'); return; }
    setSaving(true);
    try {
      await api.post('/visit-reports', {
        quotation_id: quotation.id,
        visit_date:   form.visit_date,
        visit_time:   form.visit_time,
        reported_by:  form.reported_by,
        notes:        form.notes,
        files,
      });
      toast.success('Visit report saved!');
      setForm({ visit_date: new Date().toISOString().slice(0,10), visit_time: new Date().toTimeString().slice(0,5), reported_by: user?.display||'', notes:'' });
      setFiles([]);
      setTab('list');
      load();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to save.'); }
    setSaving(false);
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this visit report?')) return;
    try {
      await api.delete('/visit-reports/' + id);
      toast.success('Deleted.');
      load();
    } catch { toast.error('Failed.'); }
  };

  const handleViewFile = async (fileId, fileName, fileType) => {
    try {
      const r = await api.get('/visit-report-files/' + fileId);
      setViewFile({ name: fileName, type: fileType, data: r.data.data.file_data });
    } catch { toast.error('Failed to load file.'); }
  };

  const fileIcon = (type) => type?.startsWith('image/') ? '🖼️' : type==='application/pdf' ? '📄' : '📎';

  const S = {
    overlay: { position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16 },
    modal:   { background:'#fff',borderRadius:18,width:'100%',maxWidth:780,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.25)',fontFamily:"'DM Sans',sans-serif" },
    header:  { padding:'18px 24px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 },
    body:    { flex:1,overflowY:'auto',padding:'20px 24px' },
    label:   { display:'block',fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 },
    input:   { width:'100%',padding:'9px 12px',border:'1.5px solid #e8e8e8',borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:'none',boxSizing:'border-box' },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      {/* File preview modal */}
      {viewFile && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setViewFile(null)}>
          <div style={{background:'#fff',borderRadius:16,padding:20,maxWidth:700,width:'100%',maxHeight:'85vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14}}>{viewFile.name}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={viewFile.data} download={viewFile.name} style={{padding:'5px 12px',background:'#E8471C',color:'#fff',borderRadius:7,textDecoration:'none',fontSize:12,fontWeight:700}}>⬇ Download</a>
                <button onClick={()=>setViewFile(null)} style={{padding:'5px 10px',background:'#f0f0f0',border:'none',borderRadius:7,cursor:'pointer'}}>✕</button>
              </div>
            </div>
            {viewFile.type?.startsWith('image/') ? <img src={viewFile.data} alt={viewFile.name} style={{width:'100%',borderRadius:8}}/> :
             viewFile.type==='application/pdf' ? <iframe src={viewFile.data} style={{width:'100%',height:'60vh',border:'none',borderRadius:8}} title="PDF"/> :
             <div style={{textAlign:'center',padding:40,color:'#aaa'}}><div style={{fontSize:48,marginBottom:12}}>📄</div><a href={viewFile.data} download={viewFile.name} style={{color:'#E8471C',fontWeight:700}}>Download File</a></div>}
          </div>
        </div>
      )}

      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:'#1a1a1a'}}>📸 Visit Reports</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:2}}>{quotation.site_name||quotation.customer_name}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {tab==='list' && <button onClick={()=>setTab('add')} style={{padding:'7px 16px',background:'#E8471C',color:'#fff',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>+ Add Report</button>}
            <button onClick={onClose} style={{background:'#f5f5f5',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',fontSize:16,color:'#888'}}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'2px solid #f0f0f0',flexShrink:0}}>
          {[{id:'list',label:`📋 All Reports (${reports.length})`},{id:'add',label:'➕ Add Report'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:'10px 20px',border:'none',background:'none',cursor:'pointer',
                fontWeight:tab===t.id?700:500,color:tab===t.id?'#E8471C':'#888',
                borderBottom:tab===t.id?'2px solid #E8471C':'2px solid transparent',
                fontSize:13,fontFamily:"'DM Sans',sans-serif",marginBottom:-2}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={S.body}>
          {/* LIST */}
          {tab==='list' && (
            loading ? <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Loading…</div> :
            reports.length===0 ? (
              <div style={{textAlign:'center',padding:48}}>
                <div style={{fontSize:40,marginBottom:10}}>📸</div>
                <div style={{fontSize:15,fontWeight:700,color:'#555',marginBottom:6}}>No visit reports yet</div>
                <div style={{fontSize:13,color:'#aaa',marginBottom:20}}>Add your first visit report with photos/documents</div>
                <button onClick={()=>setTab('add')} style={{padding:'10px 24px',background:'#E8471C',color:'#fff',border:'none',borderRadius:9,fontWeight:700,cursor:'pointer'}}>+ Add First Report</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {reports.map(r => (
                  <div key={r.id} style={{border:'1px solid #eee',borderRadius:12,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
                    <div style={{padding:'12px 16px',background:'#fafafa',borderBottom:'1px solid #eee',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:'#1a1a1a',display:'flex',alignItems:'center',gap:8}}>
                          📅 {new Date(r.visit_date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}
                          {r.visit_time && <span style={{fontSize:12,color:'#888',fontWeight:400}}>🕐 {r.visit_time}</span>}
                        </div>
                        <div style={{fontSize:12,color:'#aaa',marginTop:2}}>by {r.reported_by||'—'} · {new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      {(user?.role==='admin'||user?.role==='manager') && (
                        <button onClick={()=>handleDeleteReport(r.id)}
                          style={{background:'#FFF0F0',border:'none',borderRadius:7,padding:'5px 10px',cursor:'pointer',color:'#B91C1C',fontSize:12}}>🗑</button>
                      )}
                    </div>
                    {r.notes && <div style={{padding:'10px 16px',fontSize:13,color:'#555',background:'#fffbeb',borderBottom:'1px solid #fef3c7'}}>📝 {r.notes}</div>}
                    {r.files?.length>0 && (
                      <div style={{padding:'12px 16px',display:'flex',gap:10,flexWrap:'wrap'}}>
                        {r.files.map(f => (
                          <button key={f.id} onClick={()=>handleViewFile(f.id,f.file_name,f.file_type)}
                            style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',
                              background:'#fff4f0',border:'1.5px solid rgba(232,71,28,0.2)',borderRadius:8,
                              cursor:'pointer',fontSize:12,fontWeight:600,color:'#E8471C'}}>
                            {fileIcon(f.file_type)} {f.file_name?.length>18?f.file_name.slice(0,18)+'…':f.file_name||'File'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* ADD FORM */}
          {tab==='add' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div>
                  <label style={S.label}>Visit Date *</label>
                  <input style={S.input} type="date" value={form.visit_date} onChange={e=>setForm(f=>({...f,visit_date:e.target.value}))} />
                </div>
                <div>
                  <label style={S.label}>Visit Time</label>
                  <input style={S.input} type="time" value={form.visit_time} onChange={e=>setForm(f=>({...f,visit_time:e.target.value}))} />
                </div>
                <div>
                  <label style={S.label}>Reported By</label>
                  <input style={S.input} placeholder="Your name" value={form.reported_by} onChange={e=>setForm(f=>({...f,reported_by:e.target.value}))} />
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={S.label}>Notes / Observations</label>
                <textarea style={{...S.input,minHeight:72,resize:'vertical'}} placeholder="Site visit observations, issues found, work progress…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
              </div>

              {/* File upload — min 3 required */}
              <div style={{marginBottom:14}}>
                <label style={S.label}>
                  Attachments <span style={{color:'#E8471C'}}>* minimum 3 required</span>
                  <span style={{marginLeft:8,fontSize:10,color:files.length>=3?'#15803d':'#E8471C',fontWeight:700,background:files.length>=3?'#f0fdf4':'#fff8f5',padding:'2px 8px',borderRadius:10}}>
                    {files.length}/3+ files
                  </span>
                </label>

                {/* File list */}
                {files.length>0 && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:10}}>
                    {files.map((f,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',
                        background:'#fff4f0',border:'1.5px solid rgba(232,71,28,0.2)',borderRadius:8,fontSize:12}}>
                        {fileIcon(f.type)}
                        <span style={{maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:600,color:'#E8471C'}}>{f.name}</span>
                        <button onClick={()=>removeFile(i)} style={{background:'none',border:'none',cursor:'pointer',color:'#aaa',fontSize:14,padding:0,lineHeight:1}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <div onClick={()=>fileRef.current?.click()}
                  style={{border:`2px dashed ${fileError?'#EF4444':'#e0e0e0'}`,borderRadius:10,padding:'20px',
                    textAlign:'center',cursor:'pointer',background:'#fafafa',transition:'all 0.2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#E8471C'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=fileError?'#EF4444':'#e0e0e0'}>
                  <div style={{fontSize:28,marginBottom:6}}>📎</div>
                  <div style={{fontSize:13,color:'#666',fontWeight:500}}>Click to add files (photos, PDFs, docs)</div>
                  <div style={{fontSize:11,color:'#aaa',marginTop:3}}>Max 10MB per file · Add at least 3</div>
                </div>
                {fileError && <div style={{marginTop:6,fontSize:12,color:'#EF4444',fontWeight:600}}>⚠ {fileError}</div>}
                <input ref={fileRef} type="file" multiple style={{display:'none'}}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileAdd} />
              </div>

              {/* Progress indicator */}
              <div style={{marginBottom:18,padding:'10px 14px',background:files.length>=3?'#f0fdf4':'#fff8f5',
                borderRadius:9,border:`1px solid ${files.length>=3?'#86efac':'rgba(232,71,28,0.2)'}`,
                display:'flex',alignItems:'center',gap:10}}>
                {[1,2,3,4].map(n => (
                  <div key={n} style={{display:'flex',alignItems:'center',gap:4,fontSize:12,
                    color:files.length>=n?'#15803d':'#aaa',fontWeight:files.length>=n?700:400}}>
                    <span style={{width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
                      background:files.length>=n?'#15803d':'#e0e0e0',color:files.length>=n?'#fff':'#888'}}>
                      {files.length>=n?'✓':n}
                    </span>
                    File {n}{n===3?' (min)':n===4?' (recommended)':''}
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10}}>
                <button onClick={handleSave} disabled={saving||files.length<3}
                  style={{flex:1,padding:12,background:'#E8471C',color:'#fff',border:'none',borderRadius:10,
                    fontWeight:700,fontSize:14,cursor:saving||files.length<3?'not-allowed':'pointer',
                    opacity:saving||files.length<3?0.6:1}}>
                  {saving?'Saving…':'✅ Save Visit Report'}
                </button>
                <button onClick={()=>setTab('list')} style={{padding:'12px 18px',background:'#f5f5f5',border:'none',borderRadius:10,fontWeight:600,cursor:'pointer',color:'#666'}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPLETION STATUS MODAL
══════════════════════════════════════════════════════════════ */
function CompletionStatusModal({ quotation, user, onClose }) {
  const STAGES = [
    { key:'design',       label:'Design',           icon:'🎨' },
    { key:'electrical',   label:'Electrical',       icon:'⚡' },
    { key:'false_ceiling',label:'False Ceiling',    icon:'🏗️' },
    { key:'carcase',      label:'Carcase Fitting',  icon:'🪵' },
    { key:'door_fitting', label:'Door Fitting',     icon:'🚪' },
    { key:'accessories',  label:'Accessories Fitting',icon:'🔩'},
    { key:'deep_cleaning',label:'Deep Cleaning',    icon:'🧹' },
    { key:'furnishing',   label:'Furnishing & Cleaning',icon:'🛋️'},
  ];

  const [pct,        setPct]        = React.useState(0);
  const [stagePcts,  setStagePcts]  = React.useState({});
  const [notes,      setNotes]      = React.useState('');
  const [stageDates, setStageDates] = React.useState({});
  const [loading,    setLoading]    = React.useState(true);
  const [saving,     setSaving]     = React.useState(false);
  const [dragging,   setDragging]   = React.useState(false);
  const trackRef = React.useRef();

  // Recompute overall pct as average of all stage pcts whenever stagePcts changes
  React.useEffect(() => {
    const vals = STAGES.map(s => Number(stagePcts[s.key] ?? 0));
    const avg  = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
    setPct(avg);
  }, [stagePcts]);

  const DRAFT_KEY = 'completion_draft_' + quotation.id;

  React.useEffect(() => {
    // First load from DB
    api.get('/completion-status/' + quotation.id)
      .then(r => {
        const d = r.data.data || {};
        // Check if there's a newer draft saved locally
        try {
          const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
          if (draft.savedAt && d.updated_at) {
            const draftTime = new Date(draft.savedAt).getTime();
            const dbTime    = new Date(d.updated_at).getTime();
            if (draftTime > dbTime && Object.keys(draft.stageDates||{}).length > 0) {
              // Draft is newer — use it
              setNotes(draft.notes ?? d.notes ?? '');
              setStageDates(draft.stageDates ?? d.stage_dates ?? {});
              setStagePcts(draft.stagePcts ?? d.stage_pcts ?? {});
              setLoading(false);
              return;
            }
          }
        } catch {}
        // Use DB data
        setNotes(d.notes || '');
        setStageDates(d.stage_dates || {});
        setStagePcts(d.stage_pcts || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-line
  }, [quotation.id]);

  // Auto-save draft to localStorage whenever data changes
  React.useEffect(() => {
    if (loading) return;
    const draft = { pct, notes, stageDates, stagePcts, savedAt: new Date().toISOString() };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, [pct, notes, stageDates, stagePcts, loading]);

  const setStage = (key, field, val) =>
    setStageDates(prev => ({ ...prev, [key]: { ...(prev[key]||{}), [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/completion-status', {
        quotation_id: quotation.id,
        percentage:   pct,
        notes,
        stage_dates:  stageDates,
        stage_pcts:   stagePcts,
        updated_by:   user?.display || user?.username || '',
      });
      // Clear local draft after successful save
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      toast.success(`Saved — ${pct}% complete!`);
      onClose();
    } catch { toast.error('Failed to save.'); }
    setSaving(false);
  };

  const dragHandler = (e) => {
    e.preventDefault();
    setDragging(true);
    const calc = (ev) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      setPct(Math.round(Math.max(0, Math.min((ev.clientX - rect.left) / rect.width, 1)) * 100));
    };
    calc(e);
    const move = ev => calc(ev);
    const up   = () => { setDragging(false); document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const color = pct>=100?'#15803d':pct>=75?'#10B981':pct>=50?'#F59E0B':pct>=25?'#E8471C':'#EF4444';
  const label = pct>=100?'🎉 Completed!':pct>=75?'Almost Done':pct>=50?'Halfway There':pct>=25?'In Progress':'Just Started';

  if (loading) return null;

  const IS = { padding:'6px 8px', border:'1.5px solid #e8e8e8', borderRadius:7, fontSize:12,
    fontFamily:"'DM Sans',sans-serif", outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,
      display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:18,width:'100%',maxWidth:620,
        maxHeight:'92vh',display:'flex',flexDirection:'column',
        boxShadow:'0 24px 60px rgba(0,0,0,0.25)',fontFamily:"'DM Sans',sans-serif"}}>

        {/* Header */}
        <div style={{padding:'18px 24px',borderBottom:'1px solid #f0f0f0',flexShrink:0,
          display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:'#1a1a1a'}}>📊 Completion Status</div>
            <div style={{fontSize:12,color:'#aaa',marginTop:3,display:'flex',alignItems:'center',gap:8}}>
              {quotation.site_name||quotation.customer_name}
              {!loading && (
                <span style={{fontSize:10,background:'#FEF9E6',color:'#B45309',border:'1px solid #FCD34D',
                  borderRadius:6,padding:'1px 7px',fontWeight:700}}>
                  Draft auto-saved
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{background:'#f5f5f5',border:'none',borderRadius:8,
            width:32,height:32,cursor:'pointer',fontSize:16,color:'#888',flexShrink:0}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>

          {/* Stage dates table */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:800,color:'#888',textTransform:'uppercase',
              letterSpacing:0.8,marginBottom:12}}>Work Stages — Start & End Dates</div>
            <div style={{border:'1px solid #f0f0f0',borderRadius:12,overflow:'hidden'}}>
              {/* Table header */}
              <div style={{display:'grid',gridTemplateColumns:'1.8fr 1fr 1fr 72px',
                background:'#fafafa',borderBottom:'2px solid #E8471C',padding:'8px 14px',gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:0.5}}>Stage</div>
                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:0.5}}>Start Date</div>
                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:0.5}}>End Date</div>
                <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:0.5,textAlign:'center'}}>Days</div>
              </div>
              {/* Stage rows */}
              {STAGES.map((s, i) => {
                const sd = stageDates[s.key] || {};
                const sp = Number(stagePcts[s.key] ?? 0);
                const spColor = sp>=100?'#15803d':sp>=75?'#10B981':sp>=50?'#F59E0B':sp>=25?'#E8471C':'#EF4444';
                const calcDays = (start, end) => {
                  if (!start || !end) return null;
                  const d1 = new Date(start + 'T00:00:00');
                  const d2 = new Date(end   + 'T00:00:00');
                  const diff = Math.round((d2 - d1) / (1000*60*60*24));
                  return diff >= 0 ? diff : null;
                };
                const days = calcDays(sd.start, sd.end);
                return (
                  <div key={s.key} style={{display:'grid',gridTemplateColumns:'1.8fr 1fr 1fr 72px',
                    padding:'12px 14px',gap:8,alignItems:'start',
                    background: i%2===0 ? '#fff' : '#fafafa',
                    borderBottom: i < STAGES.length-1 ? '1px solid #f5f5f5' : 'none'}}>
                    {/* Stage label + completion bar below */}
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                        <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:'#1a1a1a'}}>{s.label}</div>
                          {days !== null && (
                            <div style={{fontSize:10,color:'#15803d',fontWeight:600,marginTop:1}}>✓ {days} day{days!==1?'s':''}</div>
                          )}
                        </div>
                      </div>
                      {/* Completion drag bar under stage name */}
                      <div style={{paddingRight:12}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                          <span style={{fontSize:10,color:'#aaa',fontWeight:600}}>Completion</span>
                          <span style={{fontSize:11,fontWeight:800,color:spColor}}>{sp}%</span>
                        </div>
                        <div
                          style={{height:10,background:'#f0f0f0',borderRadius:99,cursor:'pointer',
                            position:'relative',overflow:'visible'}}
                          onClick={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const v = Math.round(Math.max(0,Math.min((e.clientX-rect.left)/rect.width,1))*100);
                            setStagePcts(prev=>({...prev,[s.key]:v}));
                          }}
                          onMouseDown={e => {
                            e.preventDefault();
                            const el = e.currentTarget;
                            const move = ev => {
                              const rect = el.getBoundingClientRect();
                              const v = Math.round(Math.max(0,Math.min((ev.clientX-rect.left)/rect.width,1))*100);
                              setStagePcts(prev=>({...prev,[s.key]:v}));
                            };
                            const up = () => { document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); };
                            document.addEventListener('mousemove',move);
                            document.addEventListener('mouseup',up);
                          }}>
                          <div style={{height:'100%',width:sp+'%',background:spColor,
                            borderRadius:99,transition:'width 0.2s',pointerEvents:'none'}}/>
                          <div style={{position:'absolute',left:sp+'%',top:'50%',
                            transform:'translate(-50%,-50%)',width:18,height:18,
                            background:'#fff',borderRadius:'50%',border:`3px solid ${spColor}`,
                            boxShadow:'0 2px 6px rgba(0,0,0,0.2)',pointerEvents:'none',
                            transition:'left 0.1s'}}/>
                        </div>
                      </div>
                    </div>
                    {/* Start date */}
                    <div style={{paddingTop:4}}>
                      <input type="date" value={sd.start||''} style={IS}
                        onChange={e=>setStage(s.key,'start',e.target.value)}
                        onFocus={e=>e.target.style.borderColor='#E8471C'}
                        onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
                    </div>
                    {/* End date */}
                    <div style={{paddingTop:4}}>
                      <input type="date" value={sd.end||''} style={IS}
                        onChange={e=>setStage(s.key,'end',e.target.value)}
                        onFocus={e=>e.target.style.borderColor='#E8471C'}
                        onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
                    </div>
                    {/* Days worked */}
                    <div style={{textAlign:'center',paddingTop:4}}>
                      {days !== null ? (
                        <div style={{
                          background: days===0?'#FEF9E6':days<=7?'#F0FDF4':days<=14?'#EFF6FF':'#FFF0F0',
                          border: `1.5px solid ${days===0?'#FCD34D':days<=7?'#86EFAC':days<=14?'#BFDBFE':'#FECACA'}`,
                          borderRadius:8,padding:'4px 6px',display:'inline-block',minWidth:52,
                        }}>
                          <div style={{
                            fontFamily:'monospace',fontWeight:800,fontSize:14,
                            color: days===0?'#B45309':days<=7?'#15803D':days<=14?'#1D4ED8':'#B91C1C',
                            lineHeight:1,
                          }}>{days}</div>
                          <div style={{fontSize:9,color:'#888',marginTop:1,fontWeight:600}}>day{days!==1?'s':''}</div>
                        </div>
                      ) : (
                        <div style={{color:'#ddd',fontSize:12}}>—</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Total days row */}
              {(() => {
                const totalDays = STAGES.reduce((sum, s) => {
                  const sd = stageDates[s.key] || {};
                  if (!sd.start || !sd.end) return sum;
                  const d = Math.round((new Date(sd.end+'T00:00:00') - new Date(sd.start+'T00:00:00'))/(1000*60*60*24));
                  return sum + (d >= 0 ? d : 0);
                }, 0);
                const stagesWithDates = STAGES.filter(s => stageDates[s.key]?.start && stageDates[s.key]?.end).length;
                if (stagesWithDates === 0) return null;
                return (
                  <div style={{display:'grid',gridTemplateColumns:'1.8fr 1fr 1fr 72px',
                    padding:'10px 14px',gap:8,alignItems:'center',
                    background:'#1a1a1a',borderTop:'2px solid #E8471C'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:16}}>📊</span>
                      <div>
                        <div style={{fontSize:12,fontWeight:800,color:'#fff'}}>Total Work Days</div>
                        <div style={{fontSize:10,color:'#aaa',marginTop:1}}>{stagesWithDates} of {STAGES.length} stages set</div>
                      </div>
                    </div>
                    <div style={{gridColumn:'2/4',color:'#aaa',fontSize:11}}>Across all stages</div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'monospace',fontWeight:900,fontSize:18,color:'#10B981'}}>{totalDays}</div>
                      <div style={{fontSize:9,color:'#aaa',fontWeight:600}}>days total</div>
                    </div>
                    <div style={{color:'#aaa',fontSize:11,fontStyle:'italic'}}>
                      Avg: {Math.round(STAGES.reduce((s,st)=>s+Number(stagePcts[st.key]??0),0)/STAGES.length)}% overall
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Overall completion drag bar */}
          <div style={{background:'#fff8f5',border:'1.5px solid rgba(232,71,28,0.2)',
            borderRadius:14,padding:'18px 20px',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:'#888',textTransform:'uppercase',letterSpacing:0.8}}>
                Overall Project Completion
              </div>
              <span style={{fontSize:10,background:'#FEF9E6',color:'#B45309',border:'1px solid #FCD34D',
                borderRadius:6,padding:'2px 8px',fontWeight:700}}>
                ⚡ Auto-calculated from stages
              </span>
            </div>

            {/* Big pct */}
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:56,fontWeight:800,color,lineHeight:1,transition:'color 0.3s'}}>{pct}%</div>
              <div style={{fontSize:13,fontWeight:700,color,marginTop:4}}>{label}</div>
            </div>

            {/* Track */}
            <div style={{marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#ccc',marginBottom:6}}>
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
              <div ref={trackRef} onMouseDown={dragHandler}
                onClick={e=>{ const rect=trackRef.current.getBoundingClientRect(); setPct(Math.round(Math.max(0,Math.min((e.clientX-rect.left)/rect.width,1))*100)); }}
                style={{height:28,background:'#f0f0f0',borderRadius:99,cursor:'pointer',
                  position:'relative',userSelect:'none',border:'2px solid #e0e0e0'}}>
                <div style={{position:'absolute',left:0,top:0,bottom:0,borderRadius:99,
                  width:pct+'%',background:`linear-gradient(90deg,${color},${color}cc)`,
                  transition:dragging?'none':'width 0.3s',minWidth:pct>0?28:0}}/>
                {[25,50,75].map(m=>(
                  <div key={m} style={{position:'absolute',left:m+'%',top:'50%',
                    transform:'translate(-50%,-50%)',width:2,height:14,
                    background:pct>=m?'rgba(255,255,255,0.7)':'#ccc',borderRadius:99}}/>
                ))}
                <div onMouseDown={dragHandler}
                  style={{position:'absolute',left:pct+'%',top:'50%',
                    transform:'translate(-50%,-50%)',width:30,height:30,
                    background:'#fff',borderRadius:'50%',border:`3px solid ${color}`,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.2)',cursor:'grab',
                    transition:dragging?'none':'left 0.15s'}}/>
              </div>
            </div>

            {/* Presets */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {[0,10,25,50,75,90,100].map(v=>(
                <button key={v} onClick={()=>setPct(v)}
                  style={{padding:'4px 10px',border:`1.5px solid ${pct===v?color:'#e0e0e0'}`,
                    borderRadius:6,background:pct===v?color:'#fff',
                    color:pct===v?'#fff':'#555',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                  {v}%
                </button>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',
                textTransform:'uppercase',letterSpacing:0.5,marginBottom:5}}>Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="e.g. Carpentry 80% done, painting pending…"
                style={{width:'100%',padding:'9px 12px',border:'1.5px solid #e8e8e8',
                  borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif",
                  outline:'none',resize:'vertical',minHeight:60,boxSizing:'border-box'}}
                onFocus={e=>e.target.style.borderColor='#E8471C'}
                onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{padding:'14px 24px',borderTop:'1px solid #f0f0f0',flexShrink:0,
          display:'flex',gap:10}}>
          <button onClick={handleSave} disabled={saving}
            style={{flex:1,padding:12,background:color,color:'#fff',border:'none',
              borderRadius:10,fontWeight:700,fontSize:14,cursor:'pointer',
              opacity:saving?0.7:1,transition:'background 0.3s'}}>
            {saving?'Saving…':`✅ Save — ${pct}% Complete`}
          </button>
          <button onClick={onClose}
            style={{padding:'12px 20px',background:'#f5f5f5',border:'none',
              borderRadius:10,fontWeight:600,cursor:'pointer',color:'#666',fontSize:14}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminRequestsPanel({ onClose, onApproved }) {
  const [requests, setRequests]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [acting,   setActing]    = useState(null);
  const [note,     setNote]      = useState({});

  const load = useCallback(() => {
    setLoading(true);
    api.get('/edit-requests')
      .then(r => setRequests(r.data.data || []))
      .catch(() => toast.error('Failed to load requests.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = async (id, status) => {
    setActing(id);
    try {
      await api.patch('/edit-requests/' + id, { status, admin_note: note[id] || '' });
      toast.success(status === 'Approved' ? '✅ Request approved! Manager can now edit.' : '❌ Request denied.');
      if (status === 'Approved') onApproved && onApproved();
      load();
    } catch { toast.error('Failed.'); }
    setActing(null);
  };

  const pending  = requests.filter(r => r.status === 'Pending');
  const resolved = requests.filter(r => r.status !== 'Pending');

  const statusStyle = {
    Pending:  { bg:'#FEF9E6', color:'#B45309', border:'#FCD34D' },
    Approved: { bg:'#F0FDF4', color:'#15803D', border:'#86EFAC' },
    Denied:   { bg:'#FFF0F0', color:'#B91C1C', border:'#FECACA' },
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,
      display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:'#fff',borderRadius:18,width:600,maxWidth:'100%',
        maxHeight:'88vh',display:'flex',flexDirection:'column',
        boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}
        onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:'20px 24px',borderBottom:'1px solid #f0f0f0',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:'#1a1a1a',display:'flex',alignItems:'center',gap:8}}>
              📋 Edit Permission Requests
              {pending.length > 0 && (
                <span style={{background:'#E8471C',color:'#fff',borderRadius:20,
                  padding:'2px 9px',fontSize:12,fontWeight:700}}>{pending.length}</span>
              )}
            </div>
            <div style={{fontSize:12,color:'#aaa',marginTop:2}}>Review manager requests to edit booked projects</div>
          </div>
          <button onClick={onClose}
            style={{background:'#f5f5f5',border:'none',borderRadius:8,width:32,height:32,
              cursor:'pointer',fontSize:16,color:'#888'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 24px'}}>
          {loading ? (
            <div style={{textAlign:'center',padding:40,color:'#aaa'}}>Loading requests…</div>
          ) : requests.length === 0 ? (
            <div style={{textAlign:'center',padding:48}}>
              <div style={{fontSize:36,marginBottom:10}}>📭</div>
              <div style={{fontSize:15,color:'#aaa'}}>No edit requests yet.</div>
            </div>
          ) : (
            <>
              {/* Pending */}
              {pending.length > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:800,color:'#B45309',textTransform:'uppercase',
                    letterSpacing:0.8,marginBottom:10}}>⏳ Pending ({pending.length})</div>
                  {pending.map(r => (
                    <div key={r.id} style={{border:'1.5px solid #FCD34D',borderRadius:12,
                      padding:'14px 16px',marginBottom:10,background:'#FFFBEB'}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:14,color:'#1a1a1a'}}>
                            {r.site_name || r.customer_name}
                            <span style={{marginLeft:8,fontSize:11,color:'#aaa',fontWeight:500}}>
                              #{r.qid || r.quotation_id}
                            </span>
                          </div>
                          <div style={{fontSize:12,color:'#666',marginTop:3}}>
                            👤 {r.manager_name} ({r.manager_user}) ·{' '}
                            {new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </div>
                          {r.reason && (
                            <div style={{marginTop:8,padding:'8px 12px',background:'#fff',
                              borderRadius:8,border:'1px solid #fde68a',fontSize:13,color:'#555',
                              fontStyle:'italic'}}>
                              "{r.reason}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{marginBottom:8}}>
                        <input
                          placeholder="Optional note to manager (shown on deny/approve)…"
                          value={note[r.id]||''}
                          onChange={e=>setNote(n=>({...n,[r.id]:e.target.value}))}
                          style={{width:'100%',padding:'8px 12px',border:'1px solid #e0e0e0',
                            borderRadius:8,fontSize:13,fontFamily:'DM Sans,sans-serif',
                            outline:'none',boxSizing:'border-box'}}
                        />
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button disabled={acting===r.id}
                          onClick={()=>respond(r.id,'Approved')}
                          style={{flex:1,padding:'9px',background:'#10B981',color:'#fff',
                            border:'none',borderRadius:8,fontWeight:700,fontSize:13,
                            cursor:'pointer',opacity:acting===r.id?0.7:1}}>
                          ✅ Approve
                        </button>
                        <button disabled={acting===r.id}
                          onClick={()=>respond(r.id,'Denied')}
                          style={{flex:1,padding:'9px',background:'#EF4444',color:'#fff',
                            border:'none',borderRadius:8,fontWeight:700,fontSize:13,
                            cursor:'pointer',opacity:acting===r.id?0.7:1}}>
                          ❌ Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Resolved */}
              {resolved.length > 0 && (
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:'#888',textTransform:'uppercase',
                    letterSpacing:0.8,marginBottom:10}}>History ({resolved.length})</div>
                  {resolved.map(r => {
                    const ss = statusStyle[r.status] || statusStyle.Denied;
                    return (
                      <div key={r.id} style={{border:`1px solid ${ss.border}`,borderRadius:10,
                        padding:'12px 14px',marginBottom:8,background:ss.bg}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:13,color:'#1a1a1a'}}>
                              {r.site_name || r.customer_name}
                              <span style={{marginLeft:8,fontSize:11,color:'#aaa'}}>
                                by {r.manager_name}
                              </span>
                            </div>
                            {r.admin_note && <div style={{fontSize:12,color:'#666',marginTop:3}}>Note: {r.admin_note}</div>}
                          </div>
                          <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,
                            fontWeight:700,color:ss.color,background:'rgba(255,255,255,0.7)',
                            border:`1px solid ${ss.border}`}}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from '../components/QuotationPDF';
import { DEFAULT_ROOMS, calcArea, calcTotal } from '../utils/roomData';
import { printQuotation } from '../utils/printQuotation';
import ProjectManagement from '../components/ProjectManagement';
import './QuotationList.css';

const LOGO_URL = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';

const SECTION_META = {
  electrical: { label: 'Electrical Accessories', color: '#A16207', bg: '#FEFCE8' },
  wooden:     { label: 'Wooden Accessories',     color: '#9A3412', bg: '#FFF7ED' },
  marble:     { label: 'Marble & Plumbing',      color: '#166534', bg: '#F0FDF4' },
  general:    { label: 'General',                color: '#6D28D9', bg: '#F5F3FF' },
};

const INITIAL_SECTIONS = {
  electrical: { label:'Electrical Accessories', badge:'⚡ Electrical', badgeClass:'electrical-badge', sectionNum:'05', items:[{name:'Switch Board',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''}] },
  wooden:     { label:'Wooden Accessories',     badge:'🪵 Wooden',     badgeClass:'wooden-badge',     sectionNum:'06', items:[{name:'Wooden Panel',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''}] },
  marble:     { label:'Marble & Plumbing',      badge:'🪨 Marble',     badgeClass:'marble-badge',     sectionNum:'07', items:[{name:'Marble Flooring',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''}] },
  general:    { label:'General',                badge:'📦 General',    badgeClass:'general-badge',    sectionNum:'08', items:[{name:'Miscellaneous',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''}] },
};

const ROOM_COLORS = ['#8B5CF6','#3B82F6','#10B981','#F59E0B','#EF4444','#C9A84C','#EC4899','#06B6D4','#84CC16','#F97316'];
const ROOM_ICONS  = { mbr:'🛏', cbr:'🛏', hall:'🛋', dining:'🍽', kitchen:'🍳', accessories:'🔧' };

const SECTION_ICONS = {
  electrical: '⚡', wooden: '🪵', marble: '🪨', general: '📦'
};
const SECTION_COLORS = {
  electrical: '#F59E0B', wooden: '#92400E', marble: '#64748B', general: '#14B8A6'
};

const DEFAULT_TC = [
  'Payment Terms: Invoice must be paid within 25 days from the issue date.',
  'Delivery Estimate: Orders will be delivered within 45–60 business days after confirmation.',
  'Warranty: Hardware includes a standard one year warranty.',
  'Cost is inclusive of all channels, Hinges and Handles.',
  'Shipping Policy: Shipping fees may vary based on destination.',
  'The payment received corresponds to the specific items or milestones listed in this quotation.',
  'Any changes to the design or materials requested after payment will incur additional costs.',
];

const DEFAULT_NOTES = [
  'Sylvan 30 years for Kitchen and 21 years BWP 710 for other areas will be Provided.',
  'Hardware Hinges "Hettich Brand" Total House Soft closing will be Provided.',
  'Kitchen Tandem Baskets will be Provided Hettich brand.',
  'All civil works, granite & tiles will be extra costing.',
  'All electrical fittings and accessories not included in above quotation.',
  'Handles 4" & 6" and 8" (price range upto Rs.500 per Handle) will be provided.',
  'Only kitchen base will be g-profile or gola profile.',
  'Laminates (Price Range from Rs.2000 to Rs.2500) will be provided.',
  'It will be approximate estimation, based on actual Designs & dimensions it will be changed.',
  'Fully Factory finishing Except TV Unit, Partition, Wall Elevation.',
  'Booking Advance 10%.',
];

const DEFAULT_PAY_STAGES = [
  {stage:'Booking Advance',       amount:''},
  {stage:'After Design',          amount:''},
  {stage:'Material Purchase time',amount:''},
  {stage:'Carcas Installation',   amount:''},
  {stage:'Doors Fitting',         amount:''},
  {stage:'Handles Fitting',       amount:''},
  {stage:'Finishing and Hand Over',amount:''},
  {stage:'',                      amount:''},
];

/* Convert any date string to YYYY-MM-DD for <input type="date"> */
const toInputDate = (val) => {
  if (!val) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  // DD/MM/YYYY or DD-MM-YYYY
  const m = val.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // Try native Date parse as fallback
  const d = new Date(val);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return '';
};

/* Normalise pay_stages from DB — old data may be plain strings */
const normalisePayStages = (raw) => {
  if (!raw) return DEFAULT_PAY_STAGES.map(r=>({...r}));
  let arr = raw;
  if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { return DEFAULT_PAY_STAGES.map(r=>({...r})); } }
  if (!Array.isArray(arr) || !arr.length) return DEFAULT_PAY_STAGES.map(r=>({...r}));
  return arr.map(r => {
    if (typeof r === 'string') return { stage:r, paymentAmount:'', paymentDate:'', paidAmount:'', paidDate:'', paymentType:'', paymentDetails:'', receivedBy:'' };
    const payAmt = (r.paymentAmount !== undefined && r.paymentAmount !== null && r.paymentAmount !== '')
      ? String(r.paymentAmount)
      : (r.amount !== undefined && r.amount !== null && r.amount !== '') ? String(r.amount) : '';
    const paidAmt = (r.paidAmount !== undefined && r.paidAmount !== null && r.paidAmount !== '')
      ? String(r.paidAmount) : '';
    return {
      stage:          r.stage          || '',
      paymentAmount:  payAmt,
      paymentDate:    toInputDate(r.paymentDate),
      paidAmount:     paidAmt,
      paidDate:       toInputDate(r.paidDate),
      paymentType:    r.paymentType    || '',
      paymentDetails: r.paymentDetails || r.notes || '',
      receivedBy:     r.receivedBy     || '',
    };
  });
};

const newTableRow = () => ({name:'',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''});
const fileToBase64 = (file) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); });

/* ─── Unified item calc (same formula as roomData.js) ─── */
const calcItemTotal = (it) => calcTotal(it);
const calcItemArea  = (it) => calcArea(it);

/* ══════════════════════════════════════════════════════════════
   VIEW MODAL
══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   PAYMENT TRANSACTIONS MODAL
══════════════════════════════════════════════════════════════ */
// ── Decimal-safe numeric input ────────────────────────────────
function NumInput({ value, onChange, className }) {
  const [raw, setRaw] = React.useState(value === 0 ? '' : String(value ?? ''));
  React.useEffect(() => {
    setRaw(prev => {
      const parsed = parseFloat(prev);
      if (!isNaN(parsed) && parsed === value) return prev; // keep user's in-progress text
      return (value === 0 || value === '' || value == null) ? '' : String(value);
    });
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={raw}
      onChange={e => {
        const v = e.target.value;
        if (/^[0-9]*\.?[0-9]*$/.test(v)) {
          setRaw(v);
          const n = parseFloat(v);
          if (!isNaN(n)) onChange(n);
          else if (v === '') onChange(0);
        }
      }}
      onBlur={e => {
        const n = parseFloat(e.target.value);
        const final = isNaN(n) ? 0 : n;
        setRaw(final === 0 ? '' : String(final));
        onChange(final);
      }}
    />
  );
}


const LOGO_URL_PAY = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';
const PAYMENT_TC = [
  ['Booking Advance:', 'A non-refundable commitment fee required to initiate the project and secure the design slot.'],
  ['Post-Design Payment:', 'Due immediately upon final approval of 2D/3D designs. Procurement of materials will only begin once this stage is cleared.'],
  ['Material Procurement:', 'This payment covers the cost of raw materials and hardware. Orders with vendors will be placed only after the funds are credited.'],
  ['Carcass Installation:', 'Due upon completion of the basic structure at the site. Finishing works (shutters, laminates, handles) will commence only after this payment.'],
  ['Work Suspension:', 'Work will be automatically suspended if a stage payment is delayed by more than 3 business days.'],
  ['Material Price Escalation:', 'If a payment for "Material Purchase" is deferred by more than 15 days, any increase in market price will be billed as additional cost.'],
  ['Storage Charges:', 'A storage fee of 1% of the invoice value per week will apply if finished goods must be held in the warehouse.'],
  ['Quotation Validity:', 'Prices are locked until the date specified; however, the delivery timeline is contingent on timely site access and payments.'],
  ['Warranty:', 'The hardware warranty is valid only if the project has been paid for in full.'],
  ['Shipping & Handling:', 'Any special requirements (e.g., manual lifting to high floors without elevator access) will incur extra charges.'],
];
const PAY_COLS = [
  { key: 'paymentAmount',  label: 'Payment\nAmnt',    type: 'number' },
  { key: 'paymentDate',    label: 'Payment\nDate',    type: 'date'   },
  { key: 'paidAmount',     label: 'Paid\nAmnt',       type: 'number' },
  { key: 'paidDate',       label: 'Paid\nDate',       type: 'date'   },
  { key: 'paymentType',    label: 'Payment\nType',    type: 'text'   },
  { key: 'paymentDetails', label: 'Payment\nDetails', type: 'text'   },
  { key: 'receivedBy',     label: 'Received\nBy',     type: 'text'   },
];
const STAGE_W   = 150;
const COL_WIDTHS = { paymentAmount:90, paymentDate:88, paidAmount:78, paidDate:88, paymentType:82, paymentDetails:110, receivedBy:82 };
const TOTAL_W    = STAGE_W + Object.values(COL_WIDTHS).reduce((a,b)=>a+b,0) + 28;
const C_PDF = { brand:'#E8471C', dark:'#1A1A1A', gray:'#666', border:'#DDDDDD', white:'#fff', rowAlt:'#FAFAFA', lightBg:'#F5F5F5' };
const cellBase = { border:'none', background:'transparent', fontFamily:'Arial,sans-serif', fontSize:11, color:'#1A1A1A', outline:'none', padding:'6px 6px', width:'100%', boxSizing:'border-box' };

function PaymentModal({ payStages, setPayStages, onClose, clientName, smName, quotationId }) {
  const overlayRef = useRef();
  const fileRefs   = useRef({});

  // live transactions fetched from DB
  const [transactions, setTransactions] = React.useState([]);
  const [txnLoading,   setTxnLoading]   = React.useState(true);

  React.useEffect(() => {
    if (!quotationId) { setTxnLoading(false); return; }
    api.get(`/quotations/${quotationId}/transactions`)
      .then(r => setTransactions(r.data.data || []))
      .catch(() => {})
      .finally(() => setTxnLoading(false));
  }, [quotationId]);

  // compute totals per stage from real transactions
  const txnByStage = React.useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const key = (t.stage_name || '').trim().toLowerCase();
      if (!map[key]) map[key] = { paid: 0, txns: [] };
      map[key].paid += Number(t.paid_amount || 0);
      map[key].txns.push(t);
    });
    return map;
  }, [transactions]);

  const getStageTxns = (stageName) => {
    const key = (stageName || '').trim().toLowerCase();
    return txnByStage[key] || { paid: 0, txns: [] };
  };

  const update = (idx, key, val) => setPayStages(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  const addRow  = () => setPayStages(prev => [...prev, { stage:'', paymentAmount:'', paymentDate:'', paidAmount:'', paidDate:'', paymentType:'', paymentDetails:'', receivedBy:'' }]);
  const removeRow = (idx) => setPayStages(prev => prev.filter((_, i) => i !== idx));

  const handleFileChange = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => update(idx, 'attachmentData', ev.target.result) || update(idx, 'attachmentName', file.name);
    reader.readAsDataURL(file);
    // do both updates
    const reader2 = new FileReader();
    reader2.onload = (ev) => {
      setPayStages(prev => prev.map((r, i) => i === idx ? { ...r, attachmentData: ev.target.result, attachmentName: file.name } : r));
    };
    reader2.readAsDataURL(file);
  };

  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });

  const totalScheduled = payStages.reduce((s, r) => s + (parseFloat(r.paymentAmount) || 0), 0);
  const totalActualPaid = transactions.reduce((s, t) => s + Number(t.paid_amount || 0), 0);

  return (
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9999, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'24px 12px' }}>
      <div style={{ background:C_PDF.white, borderRadius:4, width:'100%', maxWidth:TOTAL_W+180, boxShadow:'0 20px 60px rgba(0,0,0,0.4)', fontFamily:'Arial,sans-serif', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 30px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C_PDF.border}`, background:C_PDF.white }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:C_PDF.brand, letterSpacing:2 }}>QUOTATION</div>
            <div style={{ fontSize:9, color:'#AAA', marginTop:2 }}>Date: {today}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <img src={LOGO_URL_PAY} alt="Deeraj Interiors" style={{ height:45, width:'auto' }} crossOrigin="anonymous" />
            <button onClick={onClose} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C_PDF.gray, padding:'2px 6px', lineHeight:1 }}>✕</button>
          </div>
        </div>
        <div style={{ height:3, background:C_PDF.brand }} />

        <div style={{ padding:'20px 30px 0' }}>
          <div style={{ textAlign:'center', fontWeight:700, fontSize:13, letterSpacing:1, marginBottom:6, color:C_PDF.dark }}>STAGE WISE PAYMENT SCHEDULE</div>

          {/* Summary bar */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:16 }}>
            <div style={{ background:'#EFF6FF', border:'1.5px solid #BFDBFE', borderRadius:8, padding:'8px 20px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#1D4ED8', fontWeight:700, letterSpacing:0.5 }}>TOTAL SCHEDULED</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#1D4ED8' }}>₹{totalScheduled.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:8, padding:'8px 20px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'#15803D', fontWeight:700, letterSpacing:0.5 }}>TOTAL RECEIVED</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#15803D' }}>₹{totalActualPaid.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ background: totalScheduled - totalActualPaid > 0 ? '#FFF5F5' : '#F0FDF4', border:`1.5px solid ${totalScheduled - totalActualPaid > 0 ? '#FECACA' : '#BBF7D0'}`, borderRadius:8, padding:'8px 20px', textAlign:'center' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:0.5, color: totalScheduled - totalActualPaid > 0 ? '#DC2626' : '#15803D' }}>BALANCE</div>
              <div style={{ fontSize:16, fontWeight:700, color: totalScheduled - totalActualPaid > 0 ? '#DC2626' : '#15803D' }}>₹{(totalScheduled - totalActualPaid).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style={{ overflowX:'auto', marginBottom:20 }}>
            <table style={{ borderCollapse:'collapse', width:'100%', fontSize:11 }}>
              <thead>
                <tr style={{ background:C_PDF.dark }}>
                  <th style={{ padding:'8px 10px', textAlign:'left', color:C_PDF.white, fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:150 }}>Payment Stage</th>
                  <th style={{ padding:'8px 8px', textAlign:'right', color:C_PDF.white, fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:100 }}>Scheduled (₹)</th>
                  <th style={{ padding:'8px 8px', textAlign:'left', color:C_PDF.white, fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:90 }}>Due Date</th>
                  <th style={{ padding:'8px 8px', textAlign:'right', color:'#86EFAC', fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:110 }}>✓ Actual Paid (₹)</th>
                  <th style={{ padding:'8px 8px', textAlign:'left', color:'#86EFAC', fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:90 }}>Paid Date</th>
                  <th style={{ padding:'8px 8px', textAlign:'left', color:'#86EFAC', fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:80 }}>Mode</th>
                  <th style={{ padding:'8px 8px', textAlign:'left', color:'#86EFAC', fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:100 }}>Ref / Details</th>
                  <th style={{ padding:'8px 8px', textAlign:'left', color:'#86EFAC', fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:80 }}>Received By</th>
                  <th style={{ padding:'8px 8px', textAlign:'center', color:C_PDF.white, fontWeight:700, fontSize:10, borderRight:'1px solid #333', minWidth:70 }}>📎 File</th>
                  <th style={{ padding:'8px 4px', background:C_PDF.dark, width:28 }} />
                </tr>
              </thead>
              <tbody>
                {payStages.map((row, idx) => {
                  const stageTxn  = getStageTxns(row.stage);
                  const totalPaid = stageTxn.paid;
                  const scheduled = parseFloat(row.paymentAmount) || 0;
                  const isPaid    = totalPaid >= scheduled && scheduled > 0;
                  const isPartial = totalPaid > 0 && totalPaid < scheduled;
                  const latestTxn = stageTxn.txns[stageTxn.txns.length - 1] || null;
                  const rowBg     = isPaid ? '#F0FDF4' : isPartial ? '#FFFBEB' : idx%2===1 ? C_PDF.rowAlt : C_PDF.white;

                  return (
                    <tr key={idx} style={{ background: rowBg }}>
                      {/* Stage name (editable) */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'2px 4px', position:'relative' }}>
                        <input value={row.stage} onChange={e=>update(idx,'stage',e.target.value)}
                          style={{ ...cellBase, fontWeight:700 }} placeholder="Stage name" />
                        {isPaid && <span style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#15803D', fontWeight:700 }}>✓</span>}
                      </td>

                      {/* Scheduled amount (editable) */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'2px 4px' }}>
                        <input type="text" inputMode="numeric" value={row.paymentAmount}
                          onChange={e=>{const v=e.target.value;if(/^[0-9]*\.?[0-9]*$/.test(v))update(idx,'paymentAmount',v);}}
                          style={{ ...cellBase, textAlign:'right', color: scheduled>0?'#1D4ED8':C_PDF.dark, fontWeight: scheduled>0?700:400 }}
                          placeholder="0" />
                      </td>

                      {/* Due date (editable) */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'2px 4px' }}>
                        <input type="date" value={row.paymentDate} onChange={e=>update(idx,'paymentDate',e.target.value)}
                          style={{ ...cellBase }} />
                      </td>

                      {/* Actual Paid — from real transactions (read-only, shows sum) */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'6px 8px', textAlign:'right' }}>
                        {txnLoading ? (
                          <span style={{ color:'#CCC', fontSize:10 }}>…</span>
                        ) : totalPaid > 0 ? (
                          <span style={{ fontWeight:700, color:'#15803D', fontSize:12 }}>₹{totalPaid.toLocaleString('en-IN')}</span>
                        ) : (
                          <span style={{ color:'#CCC', fontSize:10 }}>—</span>
                        )}
                      </td>

                      {/* Paid Date — from latest transaction */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'6px 8px' }}>
                        {latestTxn?.paid_date ? (
                          <span style={{ fontSize:11, color:C_PDF.dark }}>
                            {new Date(latestTxn.paid_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                          </span>
                        ) : <span style={{ color:'#CCC', fontSize:10 }}>—</span>}
                      </td>

                      {/* Payment mode — from latest transaction */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'6px 8px' }}>
                        {latestTxn?.payment_type ? (
                          <span style={{ background:'#EFF6FF', color:'#1D4ED8', borderRadius:20, padding:'2px 7px', fontSize:10, fontWeight:600 }}>
                            {latestTxn.payment_type}
                          </span>
                        ) : <span style={{ color:'#CCC', fontSize:10 }}>—</span>}
                      </td>

                      {/* Ref/Details — from latest transaction */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'6px 8px', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        title={latestTxn?.payment_details}>
                        {latestTxn?.payment_details || <span style={{ color:'#CCC', fontSize:10 }}>—</span>}
                      </td>

                      {/* Received by — from latest transaction */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'6px 8px' }}>
                        {latestTxn?.received_by || <span style={{ color:'#CCC', fontSize:10 }}>—</span>}
                      </td>

                      {/* File attachment (editable) */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, borderRight:`0.5px solid ${C_PDF.border}`, padding:'4px 6px', textAlign:'center' }}>
                        {row.attachmentData ? (
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                            <a href={row.attachmentData} download={row.attachmentName||'attachment'}
                              style={{ fontSize:10, color:'#15803D', fontWeight:600, textDecoration:'none' }}>
                              📎 {(row.attachmentName||'file').substring(0,8)}…
                            </a>
                            <button type="button" onClick={()=>{ update(idx,'attachmentData',''); update(idx,'attachmentName',''); if(fileRefs.current[idx]) fileRefs.current[idx].value=''; }}
                              style={{ background:'none', border:'none', color:'#EF4444', fontSize:10, cursor:'pointer', padding:0 }}>✕</button>
                          </div>
                        ) : (
                          <div>
                            <input type="file" accept="image/*,application/pdf"
                              ref={el => fileRefs.current[idx] = el}
                              onChange={e => handleFileChange(idx, e)}
                              style={{ display:'none' }} id={`file-${idx}`} />
                            <label htmlFor={`file-${idx}`}
                              style={{ cursor:'pointer', fontSize:16, color:'#CCC', display:'block' }}
                              title="Attach file">📎</label>
                          </div>
                        )}
                      </td>

                      {/* Delete row */}
                      <td style={{ borderBottom:`0.5px solid ${C_PDF.border}`, textAlign:'center', padding:'2px' }}>
                        <button type="button" onClick={()=>removeRow(idx)}
                          style={{ background:'none', border:'none', color:'#CCC', cursor:'pointer', fontSize:13, padding:'4px', lineHeight:1 }}
                          onMouseEnter={e=>e.currentTarget.style.color='#E05A5A'}
                          onMouseLeave={e=>e.currentTarget.style.color='#CCC'}>✕</button>
                      </td>
                    </tr>
                  );
                })}

                {/* Add row button */}
                <tr>
                  <td colSpan={10} style={{ borderTop:`0.5px solid ${C_PDF.border}`, padding:'8px 12px' }}>
                    <button type="button" onClick={addRow}
                      style={{ background:'none', border:`1.5px dashed ${C_PDF.border}`, borderRadius:4, padding:'4px 18px', fontSize:11, color:C_PDF.gray, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
                      + Add Row
                    </button>
                    {txnLoading && <span style={{ marginLeft:12, fontSize:11, color:'#AAA' }}>Loading payments…</span>}
                    {!txnLoading && transactions.length > 0 && (
                      <span style={{ marginLeft:16, fontSize:11, color:'#15803D', fontWeight:600 }}>
                        ✓ {transactions.length} transaction(s) loaded from records
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, fontSize:12, color:C_PDF.dark, marginBottom:10, letterSpacing:0.3 }}>TERMS AND CONDITIONS</div>
            <div style={{ border:`1px solid ${C_PDF.border}`, borderRadius:2, padding:'12px 14px' }}>
              {PAYMENT_TC.map(([bold,rest],i)=>(
                <div key={i} style={{ display:'flex', gap:6, marginBottom:6, lineHeight:1.65 }}>
                  <span style={{ color:C_PDF.brand, fontWeight:700, fontSize:11, flexShrink:0 }}>•</span>
                  <span style={{ fontSize:10, color:C_PDF.dark }}><strong>{bold}</strong> {rest}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'18px 0 24px', borderTop:`0.5px solid ${C_PDF.border}`, marginTop:8 }}>
            <div>
              <div style={{ fontSize:10, color:C_PDF.gray, marginBottom:28 }}>Prepared By</div>
              <div style={{ width:140, height:0.5, background:C_PDF.dark, marginBottom:4 }} />
              <div style={{ fontSize:11, fontWeight:700, color:C_PDF.dark }}>{smName||'Site Manager'}</div>
              <div style={{ fontSize:9, color:C_PDF.gray }}>Site Manager</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:C_PDF.gray, marginBottom:28 }}>Customer Sign :</div>
              <div style={{ width:140, height:0.5, background:C_PDF.dark, marginBottom:4, marginLeft:'auto' }} />
              <div style={{ fontSize:11, fontWeight:700, color:C_PDF.dark }}>{clientName||'Customer Name'}</div>
              <div style={{ fontSize:9, color:C_PDF.gray }}>Customer Name</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop:`1px solid ${C_PDF.border}`, padding:'14px 24px', display:'flex', justifyContent:'flex-end', gap:10, background:C_PDF.lightBg }}>
          <button type="button" onClick={onClose}
            style={{ padding:'9px 22px', border:`1.5px solid ${C_PDF.border}`, borderRadius:8, background:C_PDF.white, fontSize:13, fontWeight:600, color:C_PDF.gray, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
            Cancel
          </button>
          <button type="button" onClick={onClose}
            style={{ padding:'9px 22px', border:'none', borderRadius:8, background:C_PDF.brand, color:C_PDF.white, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Arial,sans-serif' }}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}



const PAYMENT_TYPES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'];

const emptyTxn = () => ({
  stage_name: '',
  payment_amount: '', payment_date: '',   // scheduled
  paid_amount: '',   paid_date: '',        // actual
  payment_type: 'Cash', payment_details: '', received_by: '', remarks: '',
  attachment_name: '', attachment_data: '',
});

function generateReceipt(txn, quotation, allTransactions=[]) {
  const logo = 'https://img1.wsimg.com/isteam/ip/e7e3142b-3f26-4173-bc29-b2315178edb8/DI%20logo%20(2).png/:/rs=w:559,h:192,cg:true,m/cr=w:559,h:192/qt=q:95';
  const grandTotal = Number(quotation.grand_total || 0);
  const fmtAmt = (n) => '₹' + Number(n||0).toLocaleString('en-IN');
  const inWords = (n) => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const toW = (num) => {
      if (num === 0) return '';
      if (num < 20) return a[num];
      if (num < 100) return b[Math.floor(num/10)] + (num%10?' '+a[num%10]:'');
      if (num < 1000) return a[Math.floor(num/100)]+' Hundred'+(num%100?' '+toW(num%100):'');
      if (num < 100000) return toW(Math.floor(num/1000))+' Thousand'+(num%1000?' '+toW(num%1000):'');
      if (num < 10000000) return toW(Math.floor(num/100000))+' Lakh'+(num%100000?' '+toW(num%100000):'');
      return toW(Math.floor(num/10000000))+' Crore'+(num%10000000?' '+toW(num%10000000):'');
    };
    return (toW(Math.floor(Math.abs(n)))||'Zero') + ' Rupees Only';
  };
  const fmtDate = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}); } catch { return d; } };

  const sorted    = [...allTransactions].sort((a,b) => (a.id||0)-(b.id||0));
  const txnIndex  = sorted.findIndex(t => t.id === txn.id);
  const paidUpTo  = sorted.slice(0, txnIndex+1).reduce((s,x)=>s+Number(x.paid_amount||0),0);
  const balance   = grandTotal - paidUpTo;
  const prevTxns  = sorted.slice(0, txnIndex + 1); // include current payment
  const amt       = Number(txn.paid_amount||0);
  const rNo       = `RCT-${quotation.quotation_id||quotation.id}-${String(txn.id).padStart(3,'0')}`;

  const modeChecks = ['Cash','Cheque No','UPI / Online','Money Order'].map(m => {
    const checked = (txn.payment_type||'').toLowerCase().includes(m.split(' ')[0].toLowerCase());
    const lineField = m === 'Cheque No' ? ` <span class="check-line">${(!['Cash','UPI','Online'].some(x=>(txn.payment_type||'').includes(x))&&txn.payment_details)?txn.payment_details:'___________'}</span>` : '';
    return `<span class="check-item"><span class="chk">${checked?'☑':'☐'}</span> ${m}${lineField}</span>`;
  }).join('  ');

  const prevRows = prevTxns.length > 0 ? prevTxns.map((t,i) => {
    const runTotal = sorted.slice(0,i+1).reduce((s,x)=>s+Number(x.paid_amount||0),0);
    const isCurrent = t.id === txn.id;
    const rowBg = isCurrent ? '#FFF3EF' : (i%2===0?'#FAFAFA':'#fff');
    const currentMark = isCurrent ? ' ◀ This Receipt' : '';
    return `<tr style="background:${rowBg};${isCurrent?'border-left:3px solid #E8471C;font-weight:700;':'' }">
      <td>${String(i+1).padStart(2,'0')}</td>
      <td>RCT-${quotation.quotation_id||quotation.id}-${String(t.id).padStart(3,'0')}${isCurrent?` <span style="background:#E8471C;color:#fff;font-size:8px;padding:1px 5px;border-radius:8px;margin-left:4px;">CURRENT</span>`:''}</td>
      <td>${t.stage_name||'—'}</td>
      <td>${fmtDate(t.paid_date)}</td>
      <td>${t.payment_type||'—'}</td>
      <td>${t.payment_details||'—'}</td>
      <td style="text-align:right;font-weight:700;color:${isCurrent?'#E8471C':'#1A1A1A'};">${fmtAmt(t.paid_amount)}</td>
      <td style="text-align:right;color:#15803D;font-weight:600;">${fmtAmt(runTotal)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;color:#AAA;padding:12px;font-style:italic;">No payments found</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt ${rNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:Arial,sans-serif;font-size:12px;background:#e8e8e8;padding:30px;display:flex;justify-content:center;}
    .page{background:#fff;width:700px;border:1px solid #bbb;box-shadow:0 4px 20px rgba(0,0,0,0.15);}

    /* HEADER */
    .hdr{display:flex;align-items:stretch;border-bottom:3px solid #E8471C;}
    .hdr-logo-col{padding:16px 20px;display:flex;align-items:center;gap:10px;flex:1;border-right:1px solid #eee;}
    .r-logo{height:48px;width:auto;}
    .co-info .co-name{font-size:17px;font-weight:900;color:#1A1A1A;letter-spacing:0.5px;}
    .co-info .co-addr{font-size:9.5px;color:#666;margin-top:3px;}
    .co-info .co-gst{font-size:10px;font-weight:700;color:#E8471C;margin-top:2px;letter-spacing:0.3px;}
    .hdr-title-col{background:#1A1A1A;padding:16px 22px;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;min-width:190px;}
    .r-title{font-size:20px;font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase;line-height:1.1;}
    .r-title span{color:#E8471C;}
    .r-sub{font-size:8.5px;color:#888;letter-spacing:0.8px;text-transform:uppercase;margin-top:3px;}
    .r-badge{margin-top:8px;background:#E8471C;color:#fff;font-size:10px;font-weight:800;padding:3px 10px;border-radius:3px;letter-spacing:0.5px;}

    /* META ROW */
    .meta{display:flex;align-items:center;padding:7px 20px;background:#f7f7f7;border-bottom:1px solid #e0e0e0;font-size:10.5px;color:#555;gap:28px;}
    .mv{font-weight:800;color:#1A1A1A;border-bottom:1.5px solid #333;padding-bottom:1px;margin-left:3px;}
    .paid-pill{margin-left:auto;background:#E8471C;color:#fff;font-size:9px;font-weight:800;padding:2px 10px;border-radius:20px;letter-spacing:0.5px;}

    /* FIELDS GRID */
    .fields{padding:0 20px;}
    .row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px dashed #ddd;}
    .row.single{grid-template-columns:1fr;}
    .cell{padding:9px 0 8px;font-size:11px;color:#333;}
    .cell:first-child{padding-right:16px;}
    .cell:last-child:not(:first-child){border-left:1px dashed #eee;padding-left:16px;}
    .fl{font-weight:700;color:#1A1A1A;display:block;margin-bottom:3px;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;}
    .fv{font-weight:700;color:#1A1A1A;font-size:12px;border-bottom:1.5px solid #999;display:inline-block;min-width:140px;padding-bottom:1px;}
    .amt-big{font-size:18px;font-weight:900;color:#E8471C;}
    .in-words{font-style:italic;color:#666;font-size:11px;margin-top:2px;}
    .check-row{display:flex;align-items:center;flex-wrap:wrap;gap:0 20px;padding:9px 0;border-bottom:1px dashed #ddd;font-size:11px;}
    .chk-lbl{font-weight:700;color:#1A1A1A;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;margin-right:8px;}
    .chk-item{display:flex;align-items:center;gap:4px;color:#333;}
    .chk{font-size:14px;}
    .chk-line{border-bottom:1.5px solid #999;min-width:70px;display:inline-block;margin-left:2px;}
    .recv-row{padding:9px 0;font-size:11px;color:#444;border-bottom:1px dashed #ddd;}
    .recv-val{font-style:italic;}

    /* TOTAL BAR */
    .tot-bar{display:grid;grid-template-columns:1fr 1fr 1fr;background:#1A1A1A;color:#fff;margin-top:0;}
    .tot-cell{padding:11px 20px;border-right:1px solid #333;}
    .tot-cell:last-child{border-right:none;}
    .tot-lbl{font-size:9px;color:#999;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:4px;}
    .tot-val{font-size:16px;font-weight:900;}
    .tot-val.green{color:#4ade80;}
    .tot-val.orange{color:#fb923c;}

    /* E-NOTE */
    .enote{text-align:center;padding:9px 20px;background:#fafafa;border-top:1px solid #eee;border-bottom:2px solid #e0e0e0;font-size:9.5px;color:#777;line-height:1.6;}
    .enote b{color:#444;}

    /* HISTORY */
    .hist{padding:14px 20px 18px;}
    .hist-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:7px;border-bottom:2px solid #E8471C;}
    .hist-hdr .htitle{font-size:12px;font-weight:800;color:#1A1A1A;}
    .hist-hdr .hcount{font-size:10px;color:#aaa;}
    table.ht{width:100%;border-collapse:collapse;font-size:10.5px;}
    table.ht thead tr{background:#1A1A1A;}
    table.ht thead th{color:#fff;padding:7px 8px;text-align:left;font-size:9px;font-weight:700;letter-spacing:0.4px;}
    table.ht thead th:last-child,table.ht thead th:nth-last-child(2){text-align:right;}
    table.ht tbody td{padding:7px 8px;border-bottom:1px solid #f0f0f0;color:#333;vertical-align:middle;}
    table.ht tbody tr:last-child td{border-bottom:none;}

    /* FOOTER */
    .foot{display:flex;justify-content:space-between;align-items:center;padding:8px 20px;background:#f7f7f7;border-top:1px solid #ddd;font-size:9px;color:#aaa;}
    .foot b{color:#E8471C;}

    @media print{body{background:#fff;padding:0;}.page{box-shadow:none;border:none;width:100%;}}
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-logo-col">
      <img src="${logo}" class="r-logo" crossorigin="anonymous"/>
      <div class="co-info">
        <div class="co-name">DEERAJ INTERIORS</div>
        <div class="co-addr">Plot No. 45, Kompally, Hyderabad — 500014 &nbsp;|&nbsp; +91-9848004312 &nbsp;|&nbsp; info@deerajinteriors.com</div>
        <div class="co-gst">GST No: 36AABCD1234E1ZK</div>
      </div>
    </div>
    <div class="hdr-title-col">
      <div class="r-title">Payment<br><span>Receipt</span></div>
      <div class="r-sub">Official Acknowledgement</div>
      <div class="r-badge">${rNo}</div>
    </div>
  </div>

  <!-- META ROW -->
  <div class="meta">
    <span>Date <span class="mv">${fmtDate(txn.paid_date)}</span></span>
    <span>No. <span class="mv">${rNo}</span></span>
    <span>Payment <span class="mv">#${txnIndex+1} of ${sorted.length}</span></span>
    <span class="paid-pill">PAID</span>
  </div>

  <!-- FIELDS -->
  <div class="fields">

    <div class="row">
      <div class="cell">
        <span class="fl">Received From</span>
        <span class="fv">${quotation.customer_name||'—'}</span>
      </div>
      <div class="cell">
        <span class="fl">Project / Site</span>
        <span class="fv">${quotation.site_name||quotation.location||'—'}</span>
      </div>
    </div>

    <div class="row">
      <div class="cell">
        <span class="fl">Purpose of Payment</span>
        <span class="fv">${txn.stage_name||'Interior Work'}</span>
      </div>
      <div class="cell">
        <span class="fl">Location</span>
        <span class="fv">${quotation.location||'—'}</span>
      </div>
    </div>

    <div class="row single">
      <div class="cell">
        <span class="fl">Amount Received</span>
        <span class="amt-big">${fmtAmt(amt)} /-</span>
        <div class="in-words">In Words: <em>${inWords(amt)}</em></div>
      </div>
    </div>

    <div class="check-row">
      <span class="chk-lbl">Paid By:</span>
      ${modeChecks}
    </div>

    <div class="recv-row">
      <strong>Received By: </strong>
      <span class="recv-val">${txn.received_by||'—'} &nbsp;|&nbsp; ${quotation.location||quotation.site_name||'—'} &nbsp;|&nbsp; ${quotation.mobile||'—'}</span>
    </div>

    ${txn.remarks ? `<div class="recv-row"><strong>Remarks: </strong>${txn.remarks}</div>` : ''}

  </div>

  <!-- TOTAL BAR -->
  <div class="tot-bar">
    <div class="tot-cell">
      <div class="tot-lbl">Total Project Value</div>
      <div class="tot-val">${fmtAmt(grandTotal)}</div>
    </div>
    <div class="tot-cell">
      <div class="tot-lbl">Total Paid So Far</div>
      <div class="tot-val green">${fmtAmt(paidUpTo)}</div>
    </div>
    <div class="tot-cell">
      <div class="tot-lbl">Balance Due</div>
      <div class="tot-val orange">${fmtAmt(balance)}</div>
    </div>
  </div>

  <!-- E-NOTE -->
  <div class="enote">
    <b>📧 This is an electronically generated receipt. No physical signature is required.</b><br>
    This document is valid without a stamp or signature. &nbsp;|&nbsp; For queries: info@deerajinteriors.com &nbsp;|&nbsp; +91-9848004312
  </div>

  <!-- PAYMENT HISTORY -->
  <div class="hist">
    <div class="hist-hdr">
      <span class="htitle">Payment History</span>
      <span class="hcount">${prevTxns.length} record${prevTxns.length!==1?'s':''} total</span>
    </div>
    <table class="ht">
      <thead>
        <tr>
          <th>#</th><th>Receipt No</th><th>Stage</th><th>Date</th>
          <th>Mode</th><th>Reference</th>
          <th style="text-align:right;">Amount</th>
          <th style="text-align:right;">Running Total</th>
        </tr>
      </thead>
      <tbody>${prevRows}</tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="foot">
    <div><b>DEERAJ INTERIORS</b> — Plot No. 45, Kompally, Hyderabad — 500014 | GST: 36AABCD1234E1ZK</div>
    <div>Generated: ${new Date().toLocaleDateString('en-IN')} | Ref: ${rNo}</div>
  </div>

</div>
<script>window.onload=()=>window.print();</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function PaymentTransactionsModal({ quotation, onClose, onPaymentSaved, user }) {
  const overlayRef = useRef();
  const fileRef = useRef();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyTxn());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteReqTxn, setDeleteReqTxn] = useState(null); // txn for which manager is requesting delete

  const stages = (quotation.pay_stages || []).map(s =>
    typeof s === 'string' ? s : s.stage
  ).filter(Boolean);

  const grandTotal = Number(quotation.grand_total || 0);

  const fetchTxns = async () => {
    try {
      const res = await api.get(`/quotations/${quotation.id}/transactions`);
      setTransactions(res.data.data || []);
    } catch { toast.error('Failed to load transactions'); }
    setLoading(false);
  };

  useEffect(() => { fetchTxns(); }, []);

  const totalPaid = transactions.reduce((s, t) => s + Number(t.paid_amount || 0), 0);
  const balance   = grandTotal - totalPaid;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large. Max 5MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, attachment_data: ev.target.result, attachment_name: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const hasPaymentAmt = form.payment_amount && Number(form.payment_amount) > 0;
    const hasPaidAmt    = form.paid_amount    && Number(form.paid_amount)    > 0;
    if (!hasPaymentAmt && !hasPaidAmt) {
      toast.error('Enter at least a Payment Amount or Paid Amount'); return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, form);
        toast.success('Record updated');
      } else {
        await api.post(`/quotations/${quotation.id}/transactions`, form);
        toast.success('Payment recorded');
      }
      setForm(emptyTxn()); setEditingId(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchTxns();
      if (onPaymentSaved) onPaymentSaved();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save';
      toast.error(msg);
    }
    setSaving(false);
  };

  const handleEdit = (txn) => {
    setEditingId(txn.id);
    setForm({
      stage_name:      txn.stage_name      || '',
      payment_amount:  txn.payment_amount  ? String(txn.payment_amount) : '',
      payment_date:    txn.payment_date    || '',
      paid_amount:     txn.paid_amount     ? String(txn.paid_amount)    : '',
      paid_date:       txn.paid_date       || '',
      payment_type:    txn.payment_type    || 'Cash',
      payment_details: txn.payment_details || '',
      received_by:     txn.received_by     || '',
      remarks:         txn.remarks         || '',
      attachment_name: txn.attachment_name || '',
      attachment_data: txn.attachment_data || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    await api.delete(`/transactions/${id}`);
    toast.success('Deleted');
    fetchTxns();
    if (onPaymentSaved) onPaymentSaved();
  };

  const handleClose = () => { if (onPaymentSaved) onPaymentSaved(); onClose(); };

  const C = { brand:'#E8471C', dark:'#1A1A1A', gray:'#666', border:'#E0E0E0', white:'#fff', altRow:'#FAFAFA', green:'#10B981', red:'#EF4444' };
  const inp = { width:'100%', border:`1.5px solid ${C.border}`, borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:C.dark, outline:'none', boxSizing:'border-box', background:C.white };

  return (
    <div ref={overlayRef} onClick={e=>e.target===overlayRef.current&&handleClose()}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'24px 12px'}}>
      <div style={{background:C.white,borderRadius:16,width:'100%',maxWidth:1100,boxShadow:'0 20px 60px rgba(0,0,0,0.3)',fontFamily:"'DM Sans',sans-serif",overflow:'hidden'}}>

        {/* Header */}
        <div style={{padding:'18px 24px',background:'#F8F9FB',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div>
            <h2 style={{margin:0,fontSize:18,fontWeight:700,color:C.dark}}>💳 Payment History</h2>
            <p style={{margin:'3px 0 0',fontSize:12,color:C.gray}}>{quotation.customer_name} — QID #{quotation.quotation_id||quotation.id}</p>
          </div>
          <div style={{display:'flex',gap:20,alignItems:'center'}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:C.gray}}>Total Paid</div>
              <div style={{fontSize:16,fontWeight:700,color:C.green}}>₹{totalPaid.toLocaleString('en-IN')}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:C.gray}}>Balance</div>
              <div style={{fontSize:16,fontWeight:700,color:balance>0?C.red:C.green}}>₹{balance.toLocaleString('en-IN')}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:C.gray}}>Grand Total</div>
              <div style={{fontSize:16,fontWeight:700,color:C.dark}}>₹{grandTotal.toLocaleString('en-IN')}</div>
            </div>
            <button onClick={handleClose} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:C.gray,padding:'2px 6px',lineHeight:1}}>✕</button>
          </div>
        </div>

        <div style={{padding:'20px 24px'}}>

          {/* Add / Edit Payment Form */}
          <div style={{background:'#F8F9FB',border:`1.5px solid ${C.border}`,borderRadius:12,padding:'18px',marginBottom:24}}>
            <div style={{fontWeight:700,fontSize:14,color:C.dark,marginBottom:14}}>
              {editingId ? '✏️ Edit Payment' : '➕ Record New Payment'}
            </div>
            {/* Row 1: Stage + scheduled */}
            <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>STAGE</label>
                <select value={form.stage_name} onChange={e=>setForm(p=>({...p,stage_name:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                  <option value="">— Select Stage —</option>
                  {stages.map(s=><option key={s} value={s}>{s}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAYMENT AMOUNT (₹)</label>
                <input type="text" inputMode="decimal" placeholder="Scheduled amount" value={form.payment_amount}
                  onChange={e=>{const v=e.target.value;if(/^[0-9]*\.?[0-9]*$/.test(v))setForm(p=>({...p,payment_amount:v}));}}
                  style={{...inp}} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAYMENT DATE</label>
                <input type="date" value={form.payment_date} onChange={e=>setForm(p=>({...p,payment_date:e.target.value}))} style={inp} />
              </div>
            </div>

            {/* Row 2: Paid amount + paid date + type */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.5fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAID AMOUNT (₹) *</label>
                <input type="text" inputMode="decimal" placeholder="0" value={form.paid_amount}
                  onChange={e=>{const v=e.target.value;if(/^[0-9]*\.?[0-9]*$/.test(v))setForm(p=>({...p,paid_amount:v}));}}
                  style={{...inp,fontWeight:700,color:C.brand}} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAID DATE</label>
                <input type="date" value={form.paid_date} onChange={e=>setForm(p=>({...p,paid_date:e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAYMENT TYPE</label>
                <select value={form.payment_type} onChange={e=>setForm(p=>({...p,payment_type:e.target.value}))} style={{...inp,cursor:'pointer'}}>
                  {PAYMENT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Received by + details + remarks */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.5fr',gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>RECEIVED BY</label>
                <input placeholder="Staff name" value={form.received_by} onChange={e=>setForm(p=>({...p,received_by:e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>PAYMENT DETAILS</label>
                <input placeholder="UPI ref / cheque no." value={form.payment_details} onChange={e=>setForm(p=>({...p,payment_details:e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>REMARKS</label>
                <input placeholder="Optional note" value={form.remarks} onChange={e=>setForm(p=>({...p,remarks:e.target.value}))} style={inp} />
              </div>
            </div>

            {/* Row 4: File Attachment */}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:700,color:C.gray,display:'block',marginBottom:4}}>📎 ATTACH FILE (screenshot / receipt / cheque image — max 5MB)</label>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile}
                  style={{...inp,padding:'6px 10px',cursor:'pointer',flex:1}} />
                {form.attachment_name && (
                  <div style={{display:'flex',alignItems:'center',gap:6,background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:8,padding:'6px 12px',fontSize:12,color:'#1D4ED8',fontWeight:600,whiteSpace:'nowrap'}}>
                    📄 {form.attachment_name}
                    <button onClick={()=>{setForm(p=>({...p,attachment_name:'',attachment_data:''}));if(fileRef.current)fileRef.current.value='';}}
                      style={{background:'none',border:'none',cursor:'pointer',color:'#EF4444',fontSize:14,lineHeight:1,padding:'0 2px'}}>✕</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={handleSave} disabled={saving}
                style={{padding:'9px 22px',background:C.brand,color:C.white,border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                {saving ? 'Saving…' : editingId ? '✓ Update' : '+ Record Payment'}
              </button>
              {editingId && (
                <button onClick={()=>{setEditingId(null);setForm(emptyTxn());if(fileRef.current)fileRef.current.value='';}}
                  style={{padding:'9px 18px',background:C.white,color:C.gray,border:`1.5px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Transaction History Table */}
          <div style={{fontWeight:700,fontSize:14,color:C.dark,marginBottom:12}}>📋 Payment History</div>
          {loading ? (
            <div style={{textAlign:'center',padding:30,color:C.gray}}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{textAlign:'center',padding:30,color:C.gray,background:'#F8F9FB',borderRadius:12,border:`1.5px dashed ${C.border}`}}>
              <div style={{fontSize:32,marginBottom:8}}>💸</div>
              <div style={{fontWeight:600}}>No payments recorded yet</div>
              <div style={{fontSize:12,marginTop:4}}>Use the form above to record the first payment</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:900}}>
                <thead>
                  <tr style={{background:C.dark}}>
                    <th style={{padding:'8px 10px',textAlign:'center',color:C.white,fontWeight:700,fontSize:11,width:36}}>#</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:130}}>Stage</th>
                    <th style={{padding:'8px 10px',textAlign:'right',color:C.white,fontWeight:700,fontSize:11,minWidth:100}}>Pmt Amount</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:90}}>Pmt Date</th>
                    <th style={{padding:'8px 10px',textAlign:'right',color:C.white,fontWeight:700,fontSize:11,minWidth:100}}>Paid Amount</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:90}}>Paid Date</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:80}}>Type</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:110}}>Details</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:90}}>Received By</th>
                    <th style={{padding:'8px 10px',textAlign:'left',color:C.white,fontWeight:700,fontSize:11,minWidth:70}}>File</th>
                    <th style={{padding:'8px 6px',width:110,color:C.white,fontWeight:700,fontSize:11}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn,i)=>(
                    <tr key={txn.id} style={{background:i%2===1?C.altRow:C.white,borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:'10px 10px',color:C.gray,fontSize:11,textAlign:'center'}}>{i+1}</td>
                      <td style={{padding:'8px 10px',fontWeight:600,color:C.dark}}>{txn.stage_name||'—'}</td>
                      <td style={{padding:'8px 10px',fontWeight:700,color:'#1D4ED8',textAlign:'right'}}>{txn.payment_amount&&Number(txn.payment_amount)>0?'₹'+Number(txn.payment_amount).toLocaleString('en-IN'):'—'}</td>
                      <td style={{padding:'8px 10px',color:C.dark}}>{txn.payment_date||'—'}</td>
                      <td style={{padding:'8px 10px',fontWeight:700,color:Number(txn.paid_amount)>0?C.brand:C.gray,textAlign:'right'}}>{Number(txn.paid_amount)>0?'₹'+Number(txn.paid_amount).toLocaleString('en-IN'):'—'}</td>
                      <td style={{padding:'8px 10px',color:C.dark}}>{txn.paid_date?new Date(txn.paid_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                      <td style={{padding:'8px 10px'}}>
                        <span style={{background:'#EFF6FF',color:'#1D4ED8',borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>{txn.payment_type||'—'}</span>
                      </td>
                      <td style={{padding:'8px 10px',color:C.gray,maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={txn.payment_details}>{txn.payment_details||'—'}</td>
                      <td style={{padding:'8px 10px',color:C.dark,whiteSpace:'nowrap'}}>{txn.received_by||'—'}</td>
                      <td style={{padding:'8px 10px'}}>
                        {txn.attachment_data ? (
                          <a href={txn.attachment_data} download={txn.attachment_name||'attachment'}
                            style={{background:'#F0FDF4',border:'1.5px solid #BBF7D0',borderRadius:6,padding:'4px 8px',fontSize:11,color:'#15803D',fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>
                            📎 {txn.attachment_name ? txn.attachment_name.substring(0,10)+(txn.attachment_name.length>10?'…':'') : 'File'}
                          </a>
                        ) : <span style={{color:'#CCC',fontSize:11}}>—</span>}
                      </td>
                      <td style={{padding:'8px 6px',whiteSpace:'nowrap',textAlign:'right'}}>
                        <button onClick={()=>generateReceipt(txn,quotation,transactions)} title="Print Receipt"
                          style={{background:'#FFF8F6',border:'none',borderRadius:6,padding:'5px 8px',cursor:'pointer',color:C.brand,fontSize:12,marginRight:3}}>🧾</button>
                        <button onClick={()=>handleEdit(txn)}
                          style={{background:'#EFF6FF',border:'none',borderRadius:6,padding:'5px 8px',cursor:'pointer',color:'#1D4ED8',fontSize:12,marginRight:3}}>✏️</button>
                        {user?.role==='admin' ? (
                          <button onClick={()=>handleDelete(txn.id)}
                            style={{background:'#FFF0F0',border:'none',borderRadius:6,padding:'5px 8px',cursor:'pointer',color:C.red,fontSize:12}}
                            title="Delete payment">🗑</button>
                        ) : (
                          <button onClick={()=>setDeleteReqTxn(txn)}
                            style={{background:'#FEF9E6',border:'1.5px dashed #FCD34D',borderRadius:6,padding:'5px 8px',cursor:'pointer',color:'#B45309',fontSize:12}}
                            title="Request deletion from admin">🔓</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr style={{background:'#F0FDF4',fontWeight:700}}>
                    <td colSpan={2} style={{padding:'10px 10px',color:C.dark,borderTop:`2px solid ${C.border}`}}>Total Paid</td>
                    <td colSpan={2} style={{borderTop:`2px solid ${C.border}`}}></td>
                    <td style={{padding:'10px 10px',color:C.green,fontWeight:700,borderTop:`2px solid ${C.border}`,textAlign:'right'}}>₹{totalPaid.toLocaleString('en-IN')}</td>
                    <td colSpan={6} style={{borderTop:`2px solid ${C.border}`}}></td>
                  </tr>
                  <tr style={{background:balance>0?'#FFF5F5':'#F0FDF4',fontWeight:700}}>
                    <td colSpan={2} style={{padding:'10px 10px',color:C.dark}}>Balance</td>
                    <td colSpan={2}></td>
                    <td style={{padding:'10px 10px',color:balance>0?C.red:C.green,fontWeight:700,textAlign:'right'}}>₹{balance.toLocaleString('en-IN')}</td>
                    <td colSpan={6}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment delete request modal */}
      {deleteReqTxn && (
        <PaymentDeleteRequestModal
          txn={deleteReqTxn}
          quotation={quotation}
          user={user}
          onClose={()=>setDeleteReqTxn(null)}
          onSent={()=>{ setDeleteReqTxn(null); toast.success('Request sent! Admin will review.'); }}
        />
      )}
    </div>
  );
}

function ViewModal({ data, onClose, onDelete, canDelete = true }) {
  const overlayRef = useRef();
  const bodyRef    = useRef();
  const [activeTab, setActiveTab] = useState('quotation');
  const [viewingPdf, setViewingPdf] = useState(null);
  const [blobUrl,    setBlobUrl]    = useState(null);

  // Convert base64 → Blob URL whenever viewingPdf changes (browsers block data: URIs in iframes)
  useEffect(() => {
    if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
    if (!viewingPdf?.base64) return;
    try {
      const b64 = viewingPdf.base64.includes(',') ? viewingPdf.base64.split(',')[1] : viewingPdf.base64;
      const mime = viewingPdf.base64.includes('data:') ? viewingPdf.base64.split(';')[0].split(':')[1] : 'application/pdf';
      const bytes = atob(b64);
      const arr   = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob  = new Blob([arr], { type: mime });
      setBlobUrl(URL.createObjectURL(blob));
    } catch(e) { console.error('Blob conversion failed:', e); }
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [viewingPdf]);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => { if (bodyRef.current) { const w = bodyRef.current.clientWidth - 48; setScale(Math.min(1, w/794)); } };
    update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update);
  }, []);

  const rooms    = data.rooms || {};
  const rawCd    = data.ceiling_data || {};
  const isNewFmt = rawCd.electrical||rawCd.wooden||rawCd.marble||rawCd.general;
  const sections = isNewFmt ? rawCd : null;
  const cd       = !isNewFmt ? rawCd : {};

  /* ── Use stored totals from DB — same values as list column ── */
  const totalInterior = Number(data.total_interior || 0);
  const totalCeiling  = Number(data.total_ceiling  || 0);
  const subtotal         = totalInterior + totalCeiling;
  const discountPercent  = Number(data.discount_percent || 0);
  const discountAmount   = Number(data.discount_amount  || 0);
  const afterDiscount    = subtotal - discountAmount;
  const gstPercent       = Number(data.gst_percent || 0);
  const gstAmount        = Number(data.gst_amount  || 0);
  const grandTotal       = Number(data.grand_total  || 0);

  const smName  = data.site_manager_name || '';
  const smDesig = data.site_manager_designation || 'Site Manager';
  const smPhone = data.site_manager_phone || '';
  const createdAt   = new Date(data.created_at);
  const invoiceDate = createdAt.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});
  const validDate   = new Date(createdAt.getTime()+30*24*60*60*1000).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'});

  const tcItems = Array.isArray(data.tc_items) ? data.tc_items
    : (typeof data.tc_items === 'string' && data.tc_items ? JSON.parse(data.tc_items) : DEFAULT_TC);
  const payStages   = normalisePayStages(data.pay_stages);

  // Fetch real transactions for payment schedule
  const [viewTransactions, setViewTransactions] = useState([]);
  useEffect(() => {
    if (!data.id) return;
    api.get(`/quotations/${data.id}/transactions`)
      .then(r => setViewTransactions(r.data.data || []))
      .catch(() => {});
  }, [data.id]);

  const viewTxnByStage = React.useMemo(() => {
    const map = {};
    viewTransactions.forEach(t => {
      const key = (t.stage_name || '').trim().toLowerCase();
      if (!map[key]) map[key] = { paid: 0, txns: [] };
      map[key].paid += Number(t.paid_amount || 0);
      map[key].txns.push(t);
    });
    return map;
  }, [viewTransactions]);

  const getViewStageTxn = (stageName) => {
    const key = (stageName || '').trim().toLowerCase();
    return viewTxnByStage[key] || { paid: 0, txns: [] };
  };

  const totalViewPaid = viewTransactions.reduce((s, t) => s + Number(t.paid_amount || 0), 0);
  const totalScheduled = payStages.reduce((s, r) => s + (parseFloat(r.paymentAmount) || 0), 0);

  const roomEntries  = Object.entries(rooms);
  const roomPdfs     = roomEntries.filter(([,r])=>r&&r.pdfBase64&&r.pdfName).map(([k,r])=>({key:k,name:r.pdfName,base64:r.pdfBase64,category:'Room',categoryLabel:r.label||k}));

  // Plan documents from quotation fields
  const planDocs = [
    data.floor_plan && { key:'floor_plan', name:(data.floor_plan.name||'Floor Plan'), base64: data.floor_plan.data||(typeof data.floor_plan==='string'?data.floor_plan:null), category:'Plans', categoryLabel:'Floor Plan' },
    data.plan_2d    && { key:'plan_2d',    name:(data.plan_2d.name||'2D Plan'),       base64: data.plan_2d.data   ||(typeof data.plan_2d==='string'?data.plan_2d:null),       category:'Plans', categoryLabel:'2D Plan' },
    data.plan_3d    && { key:'plan_3d',    name:(data.plan_3d.name||'3D Plan'),       base64: data.plan_3d.data   ||(typeof data.plan_3d==='string'?data.plan_3d:null),       category:'Plans', categoryLabel:'3D Plan' },
  ].filter(Boolean).filter(d=>d.base64);

  const attachedPdfs = [...planDocs, ...roomPdfs];
  const hasPdfs      = attachedPdfs.length > 0;

  const handleDownload = async () => {
    toast.loading('Generating PDF…',{id:'pdf'});
    try { const blob=await pdf(<QuotationPDF data={data}/>).toBlob(); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Deeraj_Quotation_${data.customer_name.replace(/\s+/g,'_')}_${data.id}.pdf`; a.click(); URL.revokeObjectURL(url); toast.success('Downloaded!',{id:'pdf'}); }
    catch { toast.error('Failed',{id:'pdf'}); }
  };
  const handlePrint = () => { printQuotation(data, viewTransactions); };

  const C = { gold:'#E8471C', dark:'#1A1A1A', gray:'#555', lightGray:'#F5F5F5', border:'#E0E0E0', white:'#fff', rowAlt:'#FAFAFA', sectionBg:'#FFF0EC' };
  const thBase = { padding:'5px 8px', textAlign:'left', color:C.white, fontSize:10, fontWeight:700, letterSpacing:0.4, border:'1px solid #111', background:C.dark };
  const tdBase = { padding:'6px 8px', border:`1px solid ${C.border}`, color:C.dark, verticalAlign:'top', fontSize:10 };
  const tdGold = { ...tdBase, color:C.gold, fontWeight:700 };
  const COL = { name:'26%', w:'6%', h:'6%', nos:'5%', area:'7%', type:'9%', rate:'12%', total:'13%', remark:'16%' };

  const NOTES = (() => {
    const n = Array.isArray(data.note_items) ? data.note_items
      : (typeof data.note_items === 'string' && data.note_items ? (()=>{ try { return JSON.parse(data.note_items); } catch { return null; } })() : null);
    return (Array.isArray(n) && n.length) ? n : DEFAULT_NOTES;
  })();

  const TableSection = ({ label, items, isAccessory, sectionColor, sectionBg }) => {
    if (!items||!items.length) return null;
    const total = isAccessory
      ? items.reduce((s,it)=>s+(it.nos*it.unitCost),0)
      : items.reduce((s,it)=>s+calcItemTotal(it),0);
    const bg    = sectionBg || C.sectionBg;
    const color = sectionColor || C.gold;
    return (
      <div style={{marginBottom:2}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:bg,borderLeft:`3px solid ${color}`,padding:'6px 12px',margin:'10px 0 0'}}>
          <span style={{fontSize:10,fontWeight:700,color:C.dark,letterSpacing:0.4}}>{label.toUpperCase()}</span>
          <span style={{fontSize:10,fontWeight:700,color}}>Rs. {total.toLocaleString('en-IN')}</span>
        </div>
        <div style={{overflowX:'auto'}}>
          {isAccessory ? (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,tableLayout:'fixed'}}>
              <colgroup><col style={{width:'38%'}}/><col style={{width:'12%'}}/><col style={{width:'20%'}}/><col style={{width:'14%'}}/><col style={{width:'16%'}}/></colgroup>
              <thead><tr>{[['ITEM','left'],['QTY','center'],['UNIT COST (Rs.)','right'],['TOTAL (Rs.)','right'],['REMARKS','left']].map(([h,a])=><th key={h} style={{...thBase,textAlign:a}}>{h}</th>)}</tr></thead>
              <tbody>{items.map((it,i)=>(
                <tr key={i} style={{background:i%2===1?C.rowAlt:C.white}}>
                  <td style={tdBase}>{it.name}</td>
                  <td style={{...tdBase,textAlign:'center'}}>{it.nos}</td>
                  <td style={{...tdBase,textAlign:'right'}}>{(it.unitCost||0).toLocaleString('en-IN')}</td>
                  <td style={{...tdGold,textAlign:'right'}}>{(it.nos*it.unitCost).toLocaleString('en-IN')}</td>
                  <td style={tdBase}>{it.remarks}</td>
                </tr>
              ))}</tbody>
            </table>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,tableLayout:'fixed'}}>
              <colgroup><col style={{width:COL.name}}/><col style={{width:COL.w}}/><col style={{width:COL.h}}/><col style={{width:COL.nos}}/><col style={{width:COL.area}}/><col style={{width:COL.type}}/><col style={{width:COL.rate}}/><col style={{width:COL.total}}/><col style={{width:COL.remark}}/></colgroup>
              <thead><tr>{[['PARTICULARS','left'],['W(in)','center'],['H(in)','center'],['NOS','center'],['AREA sft','center'],['TYPE','center'],['RATE(Rs.)','right'],['TOTAL(Rs.)','right'],['REMARKS','left']].map(([h,a])=><th key={h} style={{...thBase,textAlign:a}}>{h}</th>)}</tr></thead>
              <tbody>{items.map((it,i)=>{
                const area=calcItemArea(it); const tot=calcItemTotal(it);
                return (
                  <tr key={i} style={{background:i%2===1?C.rowAlt:C.white}}>
                    <td style={tdBase}>{it.name}</td>
                    <td style={{...tdBase,textAlign:'center'}}>{it.type!=='FIXED'?it.width:''}</td>
                    <td style={{...tdBase,textAlign:'center'}}>{it.type!=='FIXED'?it.height:''}</td>
                    <td style={{...tdBase,textAlign:'center'}}>{it.nos}</td>
                    <td style={{...tdBase,textAlign:'center'}}>{area||'—'}</td>
                    <td style={{...tdBase,textAlign:'center'}}>{it.type}</td>
                    <td style={{...tdBase,textAlign:'right'}}>{(it.unitCost||0).toLocaleString('en-IN')}</td>
                    <td style={{...tdGold,textAlign:'right'}}>{tot.toLocaleString('en-IN')}</td>
                    <td style={tdBase}>{it.remarks}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const A4_W = 794;
  const modalContent = (
    <div className="modal-overlay" ref={overlayRef} onClick={e=>e.target===overlayRef.current&&onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div><h2 className="modal-title">Quotation Preview</h2><p className="modal-sub">QID #{data.quotation_id||data.id} — {new Date(data.created_at).toLocaleDateString('en-IN')}</p></div>
          <div className="modal-actions">
            <button className="action-btn download" onClick={handleDownload}>⬇ Download PDF</button>
            <button className="action-btn print" onClick={handlePrint}>🖨 Print</button>
            {canDelete && <button className="action-btn delete-btn" onClick={()=>onDelete&&onDelete(data.id)}>🗑 Delete</button>}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-tabs">
          <button className={`modal-tab ${activeTab==='quotation'?'active':''}`} onClick={()=>setActiveTab('quotation')}>📋 Quotation</button>
          <button className={`modal-tab ${activeTab==='pdfs'?'active':''}`} onClick={()=>{setActiveTab('pdfs');setViewingPdf(null);}}>
            📎 Documents {hasPdfs&&<span className="pdf-count-badge">{attachedPdfs.length}</span>}
          </button>
        </div>
        <div className="modal-body" ref={bodyRef}>
          {activeTab==='quotation' && (
            <div className="vp-wrap">
              <div style={{width:'100%',display:'flex',flexDirection:'column',alignItems:'center'}}>
              <div style={{transformOrigin:'top center',transform:`scale(${scale})`,width:A4_W,display:'flex',flexDirection:'column',gap:28,marginBottom:`calc((${scale}-1)*100%)`}}>

              {/* PAGE 1 — QUOTATION */}
              <div style={{background:C.white,fontFamily:'Arial,sans-serif',fontSize:10,width:'100%',minHeight:1123,boxShadow:'0 2px 20px rgba(0,0,0,.15)',border:'1px solid #E8E8E8'}}>
                <div style={{padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}>
                  <img src={LOGO_URL} alt="" style={{height:52,width:'auto'}}/>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:13,color:C.gold,fontWeight:700,letterSpacing:2}}>QUOTATION #{data.quotation_id||data.id}</div>
                    <div style={{fontSize:9,color:'#AAA',marginTop:3}}>Date: {invoiceDate}</div>
                    <div style={{fontSize:9,color:'#AAA'}}>{smPhone?`Mobile: ${smPhone}`:'Mobile: 9000700930 / 910'}</div>
                    <div style={{fontSize:9,color:'#AAA'}}>Interior work Estimation</div>
                  </div>
                </div>
                <div style={{height:3,background:C.gold}}/>
                <div style={{display:'flex',background:C.lightGray,borderBottom:`1px solid ${C.border}`,padding:'12px 32px',gap:0}}>
                  <div style={{flex:1,paddingRight:20}}>
                    <div style={{fontSize:8,fontWeight:700,color:'#AAA',letterSpacing:1,textTransform:'uppercase',marginBottom:6,borderBottom:`1px solid ${C.border}`,paddingBottom:3}}>Client Information</div>
                    <div style={{display:'flex',gap:6,marginBottom:3}}><span style={{fontSize:8,color:C.gray,minWidth:52}}>Name</span><span style={{fontSize:11,fontWeight:700}}>{data.customer_name}</span></div>
                    <div style={{display:'flex',gap:6,marginBottom:3}}><span style={{fontSize:8,color:C.gray,minWidth:52}}>Phone</span><span style={{fontSize:11,fontWeight:700}}>{data.customer_phone||data.mobile||'—'}</span></div>
                    <div style={{display:'flex',gap:6}}><span style={{fontSize:8,color:C.gray,minWidth:52}}>Location</span><span style={{fontSize:11,fontWeight:700}}>{data.location||'—'}</span></div>
                  </div>
                  <div style={{width:1,background:C.border,margin:'0 16px'}}/>
                  <div style={{flex:1,paddingLeft:8}}>
                    <div style={{fontSize:8,fontWeight:700,color:'#AAA',letterSpacing:1,textTransform:'uppercase',marginBottom:6,borderBottom:`1px solid ${C.border}`,paddingBottom:3}}>Site Manager Information</div>
                    <div style={{display:'flex',gap:6,marginBottom:3}}><span style={{fontSize:8,color:C.gray,minWidth:65}}>Name</span><span style={{fontSize:11,fontWeight:700}}>{smName||'—'}</span></div>
                    <div style={{display:'flex',gap:6,marginBottom:3}}><span style={{fontSize:8,color:C.gray,minWidth:65}}>Designation</span><span style={{fontSize:11,fontWeight:700}}>{smDesig}</span></div>
                    <div style={{display:'flex',gap:6}}><span style={{fontSize:8,color:C.gray,minWidth:65}}>Phone</span><span style={{fontSize:11,fontWeight:700}}>{smPhone||'—'}</span></div>
                  </div>
                </div>
                <div style={{padding:'4px 24px 28px'}}>
                  {roomEntries.map(([k,room])=>room?(<TableSection key={k} label={room.label||k} items={room.items} isAccessory={k==='accessories'}/>):null)}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(232,71,28,.10)',borderRadius:3,padding:'7px 12px',margin:'10px 0 0'}}>
                    <span style={{fontWeight:700,color:C.dark,fontSize:11}}>Total 1 — Interior Work</span>
                    <span style={{fontWeight:700,color:C.gold,fontSize:12}}>Rs. {totalInterior.toLocaleString('en-IN')}</span>
                  </div>
                  {isNewFmt
                    ? Object.entries(sections).map(([k,sec])=>{const meta=SECTION_META[k]||{label:k,color:'#888',bg:'#F5F5F5'};return <TableSection key={k} label={meta.label} items={sec&&sec.items} isAccessory={false} sectionColor={meta.color} sectionBg={meta.bg}/>;})
                    : null
                  }
                  <div style={{margin:'12px 0',border:`1px solid ${C.border}`,borderRadius:4,overflow:'hidden'}}>
                    <div style={{display:'flex',justifyContent:'space-between',padding:'7px 14px',background:C.lightGray,borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:600}}>Subtotal</span><span style={{fontSize:10,fontWeight:600}}>Rs. {subtotal.toLocaleString('en-IN')}</span></div>
                    {discountPercent>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 14px',background:'#F0FDF4',borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:600,color:'#065F46'}}>Discount ({discountPercent}%)</span><span style={{fontSize:10,fontWeight:600,color:'#065F46'}}>- Rs. {discountAmount.toLocaleString('en-IN')}</span></div>}
                    {discountPercent>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 14px',background:C.lightGray,borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:600,color:'#555'}}>After Discount</span><span style={{fontSize:10,fontWeight:600}}>Rs. {afterDiscount.toLocaleString('en-IN')}</span></div>}
                    {gstPercent>0&&<div style={{display:'flex',justifyContent:'space-between',padding:'7px 14px',background:'#FFF0EC',borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:10,fontWeight:600,color:'#92400E'}}>GST ({gstPercent}%)</span><span style={{fontSize:10,fontWeight:600,color:'#92400E'}}>+ Rs. {gstAmount.toLocaleString('en-IN')}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:C.dark,padding:'9px 14px'}}>
                      <span style={{fontSize:12,color:C.gold,fontWeight:700,letterSpacing:1}}>GRAND TOTAL{discountPercent>0?` (${discountPercent}% disc)`:''}{gstPercent>0?` (incl. ${gstPercent}% GST)`:''}</span>
                      <span style={{fontSize:16,color:C.gold,fontWeight:700}}>Rs. {grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{background:C.lightGray,border:`0.5px solid ${C.border}`,borderRadius:3,padding:'9px 12px',marginTop:8}}>
                    <div style={{fontSize:9,fontWeight:700,marginBottom:4}}>NOTE:</div>
                    {NOTES.map((n,i)=><div key={i} style={{fontSize:8,color:C.gray,lineHeight:1.5,marginBottom:2}}>{i+1}. {n}</div>)}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:24,paddingTop:10,borderTop:`0.5px solid ${C.border}`}}>
                    <div style={{textAlign:'center',minWidth:110}}><div style={{height:32}}/><div style={{height:1,background:C.dark,marginBottom:4}}/><div style={{fontSize:8,color:C.gray}}>CUSTOMER SIGN</div><div style={{fontSize:9,fontWeight:700}}>{data.customer_name}</div></div>
                    <div style={{textAlign:'center',minWidth:110}}><div style={{height:32}}/><div style={{height:1,background:C.dark,marginBottom:4}}/><div style={{fontSize:8,color:C.gray}}>SITE MANAGER SIGN</div><div style={{fontSize:9,fontWeight:700}}>{smName}</div><div style={{fontSize:8,color:C.gray}}>{smDesig}</div></div>
                  </div>
                </div>
              </div>

              {/* PAGE 2 — T&C */}
              <div style={{background:C.white,width:'100%',minHeight:1123,boxShadow:'0 2px 20px rgba(0,0,0,.15)',border:'1px solid #E8E8E8'}}>
                <div style={{padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}><img src={LOGO_URL} alt="" style={{height:52,width:'auto'}}/><div style={{textAlign:'right'}}><div style={{fontSize:9,color:'#AAA'}}>Date: {invoiceDate}</div><div style={{fontSize:9,color:'#AAA'}}>{smPhone?`Mobile: ${smPhone}`:'Mobile: 9000700930 / 910'}</div></div></div>
                <div style={{height:3,background:C.gold}}/>
                <div style={{padding:'24px 32px'}}>
                  <div style={{fontSize:14,fontWeight:900,color:C.dark,marginBottom:12}}>TERMS AND CONDITIONS</div>
                  <div style={{background:'#FFF0EC',border:'1px solid #FDE8E2',borderRadius:5,padding:'12px 16px',marginBottom:8}}>
                    <ul style={{margin:0,paddingLeft:16,listStyle:'disc'}}>
                      {tcItems.map((t,i)=><li key={i} style={{fontSize:10,color:'#333',lineHeight:1.65,marginBottom:3}}>{t}</li>)}
                      <li style={{fontSize:10,color:'#333',lineHeight:1.65,marginBottom:3}}>Quotation Validity: This quotation remains valid until {validDate}.</li>
                    </ul>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:36}}>
                    <div style={{minWidth:130}}><div style={{fontSize:9,color:'#888'}}>Prepared By</div><div style={{height:36}}/><div style={{height:1,background:'#AAA',marginBottom:4}}/><div style={{fontSize:10,fontWeight:700}}>{smName}</div><div style={{fontSize:9,color:'#888'}}>{smDesig}</div></div>
                    <div style={{minWidth:130,textAlign:'right'}}><div style={{fontSize:9,color:'#888'}}>Customer Sign</div><div style={{height:36}}/><div style={{height:1,background:'#AAA',marginBottom:4}}/><div style={{fontSize:10,fontWeight:700}}>{data.customer_name}</div></div>
                  </div>
                </div>
              </div>

              {/* PAGE 3 — STAGE WISE PAYMENT */}
              <div style={{background:C.white,width:'100%',minHeight:1123,boxShadow:'0 2px 20px rgba(0,0,0,.15)',border:'1px solid #E8E8E8'}}>
                <div style={{padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}><img src={LOGO_URL} alt="" style={{height:52,width:'auto'}}/><div style={{textAlign:'right'}}><div style={{fontSize:9,color:'#AAA'}}>Date: {invoiceDate}</div></div></div>
                <div style={{height:3,background:C.gold}}/>
                <div style={{padding:'24px 32px'}}>                  <div style={{textAlign:'center',fontSize:13,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>STAGE WISE PAYMENT SCHEDULE</div>
                  {/* Summary row */}
                  <div style={{display:'flex',gap:12,marginBottom:14,justifyContent:'center'}}>
                    <div style={{background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:6,padding:'6px 16px',textAlign:'center'}}>
                      <div style={{fontSize:8,color:'#1D4ED8',fontWeight:700,letterSpacing:0.5}}>TOTAL SCHEDULED</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#1D4ED8'}}>₹{totalScheduled.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{background:'#F0FDF4',border:'1.5px solid #BBF7D0',borderRadius:6,padding:'6px 16px',textAlign:'center'}}>
                      <div style={{fontSize:8,color:'#15803D',fontWeight:700,letterSpacing:0.5}}>TOTAL RECEIVED</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#15803D'}}>₹{totalViewPaid.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{background:totalScheduled-totalViewPaid>0?'#FFF5F5':'#F0FDF4',border:`1.5px solid ${totalScheduled-totalViewPaid>0?'#FECACA':'#BBF7D0'}`,borderRadius:6,padding:'6px 16px',textAlign:'center'}}>
                      <div style={{fontSize:8,fontWeight:700,letterSpacing:0.5,color:totalScheduled-totalViewPaid>0?'#DC2626':'#15803D'}}>BALANCE</div>
                      <div style={{fontSize:13,fontWeight:700,color:totalScheduled-totalViewPaid>0?'#DC2626':'#15803D'}}>₹{(totalScheduled-totalViewPaid).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',minWidth:600,borderCollapse:'collapse',fontSize:9}}>
                      <thead>
                        <tr>
                          {['Payment Stage','Scheduled (₹)','Due Date','✓ Actual Paid (₹)','Paid Date','Mode','Ref / Details','Received By'].map((h,hi)=>(
                            <th key={h} style={{...thBase,fontSize:8,padding:'6px 7px',color:hi>=3&&hi<=7?'#86EFAC':'#fff'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{payStages.map((row,i)=>{
                        const stxn = getViewStageTxn(row.stage);
                        const totalPaid = stxn.paid;
                        const scheduled = parseFloat(row.paymentAmount)||0;
                        const latestTxn = stxn.txns[stxn.txns.length-1]||null;
                        const isPaid = totalPaid>=scheduled&&scheduled>0;
                        const isPartial = totalPaid>0&&totalPaid<scheduled;
                        const rowBg = isPaid?'#F0FDF4':isPartial?'#FFFBEB':i%2===1?C.rowAlt:C.white;
                        return (
                          <tr key={i} style={{background:rowBg}}>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontWeight:700,fontSize:9}}>
                              {row.stage||''}{isPaid&&<span style={{color:'#15803D',marginLeft:4}}>✓</span>}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,fontWeight:scheduled?700:400,color:scheduled?'#1D4ED8':'#999',textAlign:'right'}}>
                              {scheduled?`₹${scheduled.toLocaleString('en-IN')}`:'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,color:'#555'}}>
                              {row.paymentDate?new Date(row.paymentDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,fontWeight:700,color:totalPaid>0?'#15803D':'#CCC',textAlign:'right'}}>
                              {totalPaid>0?`₹${totalPaid.toLocaleString('en-IN')}`:'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,color:'#555'}}>
                              {latestTxn?.paid_date?new Date(latestTxn.paid_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9}}>
                              {latestTxn?.payment_type?<span style={{background:'#EFF6FF',color:'#1D4ED8',borderRadius:10,padding:'1px 6px',fontSize:8,fontWeight:600}}>{latestTxn.payment_type}</span>:'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,color:'#555',maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={latestTxn?.payment_details}>
                              {latestTxn?.payment_details||'-'}
                            </td>
                            <td style={{padding:'9px 7px',border:`1px solid ${C.border}`,fontSize:9,color:'#555'}}>
                              {latestTxn?.received_by||'-'}
                            </td>
                          </tr>
                        );
                      })}</tbody>
                      <tfoot>
                        <tr style={{background:'#F0FDF4',fontWeight:700}}>
                          <td style={{padding:'8px 7px',border:`1px solid ${C.border}`,fontSize:9,fontWeight:700}} colSpan={1}>TOTAL</td>
                          <td style={{padding:'8px 7px',border:`1px solid ${C.border}`,fontSize:9,fontWeight:700,color:'#1D4ED8',textAlign:'right'}}>₹{totalScheduled.toLocaleString('en-IN')}</td>
                          <td style={{padding:'8px 7px',border:`1px solid ${C.border}`}}/>
                          <td style={{padding:'8px 7px',border:`1px solid ${C.border}`,fontSize:9,fontWeight:700,color:'#15803D',textAlign:'right'}}>₹{totalViewPaid.toLocaleString('en-IN')}</td>
                          <td colSpan={4} style={{padding:'8px 7px',border:`1px solid ${C.border}`,fontSize:9,color:totalScheduled-totalViewPaid>0?'#DC2626':'#15803D',fontWeight:700}}>
                            Balance: ₹{(totalScheduled-totalViewPaid).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              {/* PAGE 4 — PAYMENT T&C */}
              <div style={{background:C.white,width:'100%',minHeight:1123,boxShadow:'0 2px 20px rgba(0,0,0,.15)',border:'1px solid #E8E8E8'}}>
                <div style={{padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}><img src={LOGO_URL} alt="" style={{height:52,width:'auto'}}/><div style={{textAlign:'right'}}><div style={{fontSize:9,color:'#AAA'}}>Date: {invoiceDate}</div></div></div>
                <div style={{height:3,background:C.gold}}/>
                <div style={{padding:'24px 32px'}}>
                  <div style={{fontSize:13,fontWeight:800,letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>STAGE WISE PAYMENT — TERMS & CONDITIONS</div>
                  <ul style={{margin:0,paddingLeft:16,listStyle:'disc'}}>
                    {[['Booking Advance:','A non-refundable commitment fee required to initiate the project.'],['Post-Design Payment:','Due upon final approval of 2D/3D designs. Procurement begins only after this is cleared.'],['Material Procurement:','Covers raw materials and hardware. Vendor orders placed only after funds are credited.'],['Carcass Installation:','Due upon completion of basic structure. Finishing works commence after this payment.'],['Work Suspension:','Work suspended if a stage payment is delayed by more than 3 business days.'],['Material Price Escalation:','If "Material Purchase" is deferred 15+ days, any price increase will be billed additionally.'],['Storage Charges:','If handover is deferred, a storage fee of 1% of invoice value per week applies.'],['Warranty:','The 6-month hardware warranty is valid only after full payment.']].map(([b,r],i)=>(
                      <li key={i} style={{fontSize:10,color:'#333',lineHeight:1.65,marginBottom:3}}><strong>{b}</strong> {r}</li>
                    ))}
                  </ul>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:36}}>
                    <div style={{minWidth:130}}><div style={{fontSize:9,color:'#888'}}>Prepared By</div><div style={{height:36}}/><div style={{height:1,background:'#AAA',marginBottom:4}}/><div style={{fontSize:10,fontWeight:700}}>{smName}</div><div style={{fontSize:9,color:'#888'}}>{smDesig}</div></div>
                    <div style={{minWidth:130,textAlign:'right'}}><div style={{fontSize:9,color:'#888'}}>Customer Sign</div><div style={{height:36}}/><div style={{height:1,background:'#AAA',marginBottom:4}}/><div style={{fontSize:10,fontWeight:700}}>{data.customer_name}</div></div>
                  </div>
                </div>
              </div>

              </div></div>
            </div>
          )}
          {activeTab==='pdfs'&&(
            <div className="pdf-viewer-tab">
              {!hasPdfs ? (
                <div className="pdf-empty-state">
                  <div className="pdf-empty-icon">📎</div>
                  <h3>No Documents Attached</h3>
                  <p>Attach floor plans, 2D/3D plans, or room PDFs when creating a quotation.</p>
                </div>
              ) : viewingPdf ? (
                <div className="pdf-fullview">
                  <div className="pdf-fullview-header">
                    <button className="pdf-back-btn" onClick={()=>{setViewingPdf(null);if(blobUrl)URL.revokeObjectURL(blobUrl);setBlobUrl(null);}}>← Back</button>
                    <span className="pdf-fullview-name">{viewingPdf.category==='Plans'?'🗺️':'📄'} {viewingPdf.name}</span>
                    <span style={{fontSize:11,color:'#888',marginLeft:8}}>{viewingPdf.categoryLabel}</span>
                    <a className="pdf-download-btn" href={viewingPdf.base64} download={viewingPdf.name}>⬇ Download</a>
                    {blobUrl && <button className="pdf-download-btn" style={{marginLeft:6,background:'#1D4ED8',color:'#fff',border:'none',cursor:'pointer'}} onClick={()=>window.open(blobUrl,'_blank')}>↗ Open in Tab</button>}
                  </div>
                  {blobUrl ? (
                    viewingPdf.base64 && (viewingPdf.base64.includes('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(viewingPdf.name||'')) ? (
                      <div style={{flex:1,overflow:'auto',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',background:'#F5F5F5'}}>
                        <img src={blobUrl} alt={viewingPdf.name} style={{maxWidth:'100%',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,0.15)'}} />
                      </div>
                    ) : (
                      <iframe src={blobUrl} title={viewingPdf.name} className="pdf-iframe" style={{flex:1,width:'100%',border:'none',minHeight:600}}/>
                    )
                  ) : (
                    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,color:'#888',background:'#F8F8F8'}}>
                      <div style={{fontSize:40}}>⏳</div>
                      <div style={{fontSize:14,fontWeight:600}}>Loading document…</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pdf-list">
                  <p className="pdf-list-hint">Click a document to view it inline.</p>
                  {['Plans','Room'].map(cat => {
                    const docs = attachedPdfs.filter(d=>d.category===cat);
                    if (!docs.length) return null;
                    return (
                      <div key={cat} style={{marginBottom:18}}>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:'#888',textTransform:'uppercase',marginBottom:10,paddingBottom:5,borderBottom:'1.5px solid #EBEBEB'}}>
                          {cat==='Plans'?'📐 Project Plans':'🚪 Room Documents'}
                        </div>
                        {docs.map((p,i)=>(
                          <div key={i} className="pdf-list-item" onClick={()=>setViewingPdf(p)}>
                            <div className="pdf-list-icon">{cat==='Plans'?'🗺️':'📄'}</div>
                            <div className="pdf-list-info">
                              <div className="pdf-list-name">{p.name}</div>
                              <div className="pdf-list-room">{p.categoryLabel}</div>
                            </div>
                            <a className="pdf-open-btn" href={p.base64} download={p.name} onClick={e=>e.stopPropagation()}>⬇</a>
                            <button className="pdf-open-btn" style={{marginLeft:4}}>Open →</button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalContent, document.body);
}

/* ══════════════════════════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════════════════════════ */
function EditModal({ data, onClose, onSaved, onDelete, canDelete = true }) {
  const fileInputRefs = useRef({});
  const overlayRef    = useRef();

  // ── All fields pre-filled from data ─────────────────────────
  const [projectType,    setProjectType]    = useState(data.project_type || '');
  const [clientName,     setClientName]     = useState(data.customer_name || '');
  const [clientPhone,    setClientPhone]    = useState(data.customer_phone || data.mobile || '');
  const [clientAltPhone, setClientAltPhone] = useState(data.customer_alt_phone || '');
  const [fullAddress,    setFullAddress]    = useState(data.full_address || '');
  const [pincode,        setPincode]        = useState(data.pincode || '');
  const [villaNumber,    setVillaNumber]    = useState(data.villa_number || '');
  const [siteName,       setSiteName]       = useState(data.site_name || '');
  const [location,       setLocation]       = useState(data.location || '');
  const [smName,         setSmName]         = useState(data.site_manager_name || '');
  const [smPhone,        setSmPhone]        = useState(data.site_manager_phone || '');
  const [smDesignation,  setSmDesignation]  = useState(data.site_manager_designation || '');
  const [smBranch,       setSmBranch]       = useState(data.site_manager_branch || '');
  const [projectStartDate, setProjectStartDate] = useState(data.project_start_date ? data.project_start_date.slice(0,10) : '');
  const [projectEndDate,   setProjectEndDate]   = useState(data.project_end_date   ? data.project_end_date.slice(0,10)   : '');
  const [gstPercent,      setGstPercent]      = useState(Number(data.gst_percent)      || 0);
  const [discountPercent, setDiscountPercent] = useState(Number(data.discount_percent) || 0);
  const [saving,         setSaving]         = useState(false);
  const [minimized,      setMinimized]      = useState({});
  const toggleMinimize = (key) => setMinimized(prev => ({ ...prev, [key]: !prev[key] }));

  // ── T&C ─────────────────────────────────────────────────────
  const [tcItems,   setTcItems]   = useState(() => {
    if (Array.isArray(data.tc_items) && data.tc_items.length) return data.tc_items;
    if (typeof data.tc_items === 'string' && data.tc_items) {
      try { const p = JSON.parse(data.tc_items); return Array.isArray(p) ? p : [...DEFAULT_TC]; } catch {}
    }
    return [...DEFAULT_TC];
  });
  const [newTcText, setNewTcText] = useState('');

  // ── Note Points ──────────────────────────────────────────────
  const [noteItems, setNoteItems] = useState(() => {
    if (Array.isArray(data.note_items) && data.note_items.length) return data.note_items;
    if (typeof data.note_items === 'string' && data.note_items) {
      try { const p = JSON.parse(data.note_items); return Array.isArray(p) && p.length ? p : [...DEFAULT_NOTES]; } catch {}
    }
    return [...DEFAULT_NOTES];
  });
  const [newNoteText, setNewNoteText] = useState('');

  // ── Payment stages ───────────────────────────────────────────
  const [payStages,        setPayStages]        = useState(() => normalisePayStages(data.pay_stages));
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ── Add Room ─────────────────────────────────────────────────
  const [showAddRoom,    setShowAddRoom]    = useState(false);
  const [newRoomName,    setNewRoomName]    = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // ── Rooms ────────────────────────────────────────────────────
  const [rooms, setRooms] = useState(() => {
    const saved = data.rooms || {};
    const r = {};
    // Load saved rooms — preserve pdfBase64/pdfName from DB
    Object.entries(saved).forEach(([k, v]) => {
      r[k] = {
        ...v,
        items: (v.items||[]).map(i=>({...i})),
        pdfFile: null,
        pdfName: v.pdfName || v.pdfBase64 ? (v.pdfName || 'Attached PDF') : '',
        pdfBase64: v.pdfBase64 || null,
      };
    });
    // Add any default rooms that don't exist yet
    Object.entries(DEFAULT_ROOMS).forEach(([k, v]) => {
      if (!r[k]) r[k] = { ...v, items: v.items.map(i=>({...i,width:0,height:0,nos:0,unitCost:0,remarks:''})), pdfFile: null, pdfName: '' };
    });
    return r;
  });

  // ── Sections ─────────────────────────────────────────────────
  const [sections, setSections] = useState(() => {
    const rawCd = data.ceiling_data || {};
    const isNewFmt = rawCd.electrical||rawCd.wooden||rawCd.marble||rawCd.general;
    const s = {};
    Object.entries(INITIAL_SECTIONS).forEach(([k, v]) => {
      s[k] = (isNewFmt && rawCd[k])
        ? { ...v, items: rawCd[k].items.map(i=>({...i})) }
        : { ...v, items: v.items.map(i=>({...i})) };
    });
    // Load any custom sections saved in ceiling_data
    if (isNewFmt) {
      Object.entries(rawCd).forEach(([k, v]) => {
        if (!INITIAL_SECTIONS[k] && v && v.items) {
          s[k] = { ...v, items: v.items.map(i=>({...i})), isCustom: true };
          if (!SECTION_COLORS[k]) SECTION_COLORS[k] = '#8B5CF6';
          if (!SECTION_ICONS[k])  SECTION_ICONS[k]  = '📦';
        }
      });
    }
    return s;
  });

  // ── Helpers ──────────────────────────────────────────────────
  const updateItem     = (rk,idx,f,v) => setRooms(p=>({...p,[rk]:{...p[rk],items:p[rk].items.map((it,i)=>i===idx?{...it,[f]:v}:it)}}));
  const addItem        = (rk)         => setRooms(p=>({...p,[rk]:{...p[rk],items:[...p[rk].items,{name:'New Item',width:0,height:0,nos:1,type:'BOX',unitCost:1300,remarks:''}]}}));
  const removeItem     = (rk,idx)     => setRooms(p=>({...p,[rk]:{...p[rk],items:p[rk].items.filter((_,i)=>i!==idx)}}));
  const updateRoomLabel= (rk,label)   => setRooms(p=>({...p,[rk]:{...p[rk],label}}));
  const updateSec      = (sk,idx,f,v) => setSections(p=>({...p,[sk]:{...p[sk],items:p[sk].items.map((it,i)=>i===idx?{...it,[f]:v}:it)}}));
  const addSecRow      = (sk)         => setSections(p=>({...p,[sk]:{...p[sk],items:[...p[sk].items,newTableRow()]}}));
  const removeSecRow   = (sk,idx)     => setSections(p=>({...p,[sk]:{...p[sk],items:p[sk].items.filter((_,i)=>i!==idx)}}));

  const handlePdfUpload = (roomKey, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    setRooms(prev => ({ ...prev, [roomKey]: { ...prev[roomKey], pdfFile: file, pdfName: file.name } }));
    toast.success(`PDF attached to ${rooms[roomKey].label}`);
  };

  const addNewRoom = () => {
    if (!newRoomName.trim()) { toast.error('Enter a room name'); return; }
    const key = `custom_${Date.now()}`;
    const colorIdx = Object.keys(rooms).length % ROOM_COLORS.length;
    setRooms(prev=>({...prev,[key]:{label:newRoomName.trim(),color:ROOM_COLORS[colorIdx],isCustom:true,pdfFile:null,pdfName:'',items:[{name:'New Item',width:0,height:0,nos:0,type:'BOX',unitCost:0,remarks:''}]}}));
    setNewRoomName(''); setShowAddRoom(false);
  };
  const deleteRoom = (rk) => {
    setRooms(prev=>{ const u={...prev}; delete u[rk]; return u; });
  };

  const addNewSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    const key = 'custom_sec_' + Date.now();
    const color = ['#8B5CF6','#0EA5E9','#F97316','#10B981','#EC4899'][Object.keys(sections).length % 5];
    setSections(prev => ({
      ...prev,
      [key]: { label: name, badge: '📦 '+name, badgeClass:'general-badge', sectionNum:'', items:[{name:'Item',width:0,height:0,nos:1,type:'FIXED',unitCost:0,remarks:''}], isCustom:true, color }
    }));
    SECTION_COLORS[key] = color; SECTION_ICONS[key] = '📦';
    setNewSectionName(''); setShowAddSection(false);
  };


  // ── Totals ───────────────────────────────────────────────────
  const totalInterior    = Object.values(rooms).reduce((s,r)=>s+r.items.reduce((ss,it)=>ss+calcItemTotal(it),0),0);
  const sectionTotals    = {};
  Object.entries(sections).forEach(([k,sec])=>{ sectionTotals[k]=sec.items.reduce((s,it)=>s+calcItemTotal(it),0); });
  const totalAllSections = Object.values(sectionTotals).reduce((s,v)=>s+v,0);
  const subtotal         = totalInterior + totalAllSections;
  const discountAmount   = Math.round(subtotal * discountPercent / 100);
  const afterDiscount    = subtotal - discountAmount;
  const gstAmount        = Math.round(afterDiscount * gstPercent / 100);
  const grandTotal       = afterDiscount + gstAmount;

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!clientName||!clientPhone) { toast.error('Name and phone are required'); return; }
    setSaving(true);
    try {
      const roomsToSave = {};
      for (const [k,v] of Object.entries(rooms)) {
        const { pdfFile, ...rest } = v;
        if (pdfFile) rest.pdfBase64 = await fileToBase64(pdfFile);
        roomsToSave[k] = rest;
      }
      const payload = {
        customer_name: clientName, customer_phone: clientPhone,
        customer_alt_phone: clientAltPhone, full_address: fullAddress,
        pincode, villa_number: villaNumber, site_name: siteName,
        location, mobile: clientPhone, project_type: projectType,
        site_manager_name: smName, site_manager_phone: smPhone,
        site_manager_designation: smDesignation, site_manager_branch: smBranch,
        project_start_date: projectStartDate || null,
        project_end_date:   projectEndDate   || null,
        rooms: roomsToSave, accessories: roomsToSave.accessories,
        ceiling_data: sections,
        tc_items: Array.isArray(tcItems) ? tcItems : (typeof tcItems === 'string' ? JSON.parse(tcItems) : []),
        note_items: Array.isArray(noteItems) ? noteItems : (typeof noteItems === 'string' ? JSON.parse(noteItems) : []),
        discount_percent: discountPercent, discount_amount: discountAmount,
        gst_percent: gstPercent, gst_amount: gstAmount,
        total_interior: totalInterior, total_ceiling: totalAllSections, grand_total: grandTotal,
        total_sft: parseFloat(Object.entries(rooms).reduce((s, [k, r]) => {
          if (k === 'accessories') return s;
          return s + r.items.reduce((ss, i) => ss + calcArea(i), 0);
        }, 0).toFixed(2)),
        pay_stages: payStages,
        project_status: data.project_status || 'Unbooked',
      };
      await api.put(`/quotations/${data.id}`, payload);
      await api.put(`/quotations/${data.id}/payment-stages`, { pay_stages: payStages });
      toast.success('Quotation updated!');
      const fresh = await api.get(`/quotations/${data.id}`);
      onSaved(fresh.data.data);
      onClose();
    } catch(err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors || [];
        errs.forEach(e => toast.error(e, { duration: 4000 }));
      } else if (err.response?.status === 401) {
        toast.error('Unauthorized: check your API key');
      } else {
        const msg = err.response?.data?.message || 'Failed to save';
        toast.error(msg, { duration: 6000 });
      }
      console.error('handleSave error:', err.response?.data || err.message);
    }
    setSaving(false);
  };

  return ReactDOM.createPortal(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:8000,overflowY:'auto',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'0'}}>
      <div style={{width:'100%',minHeight:'100vh',background:'var(--bg,#F7F6F3)',display:'flex',flexDirection:'column'}}>

        {/* ── Top bar ── */}
        <div style={{position:'sticky',top:0,zIndex:10,background:'#fff',borderBottom:'1.5px solid #E5E5E5',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button type="button" onClick={onClose} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'transparent',border:'1.5px solid #E5E5E5',borderRadius:9,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:'#555',cursor:'pointer'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L3.5 6.5L8.5 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              Back
            </button>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#1A1A1A',fontFamily:"'DM Sans',sans-serif"}}>Edit Quotation #{data.quotation_id||data.id}</h1>
              <p style={{margin:0,fontSize:13,color:'#888',fontFamily:"'DM Sans',sans-serif"}}>Update quotation details</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:11,color:'#888',fontFamily:"'DM Sans',sans-serif",letterSpacing:'0.5px',textTransform:'uppercase'}}>Grand Total</div>
              <div style={{fontSize:24,fontWeight:800,color:'#E8471C',fontFamily:"'DM Sans',sans-serif"}}>₹{grandTotal.toLocaleString('en-IN')}</div>
            </div>
            {canDelete && <button type="button" onClick={()=>onDelete&&onDelete(data.id)} style={{padding:'8px 14px',borderRadius:9,border:'1.5px solid #FFE0E0',background:'#FFF0F0',color:'#E05A5A',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>🗑 Delete</button>}

            <button type="button" onClick={handleSave} disabled={saving} style={{padding:'10px 24px',borderRadius:10,border:'none',background:'#E8471C',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(232,71,28,0.3)',opacity:saving?0.7:1}}>
              {saving ? '⏳ Saving…' : '💾 Save & Close'}
            </button>
          </div>
        </div>

        {/* ── Client name banner ── */}
        {clientName && (
          <div style={{margin:'24px 28px 0',padding:'16px 24px',background:'linear-gradient(135deg,#1A1A1A,#2d1200)',borderRadius:14,borderLeft:'4px solid #E8471C',display:'flex',alignItems:'center',gap:14,boxShadow:'0 4px 20px rgba(232,71,28,0.15)'}}>
            <div style={{width:48,height:48,borderRadius:12,background:'#E8471C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:11,color:'#aaa',letterSpacing:'1.5px',textTransform:'uppercase',fontFamily:"'DM Sans',sans-serif",marginBottom:3}}>Editing Quotation For</div>
              <div style={{fontSize:24,fontWeight:800,color:'#fff',fontFamily:"'Playfair Display',serif",lineHeight:1.1}}>{clientName}</div>
            </div>
          </div>
        )}

        {/* ── Form body (same CSS as QuotationForm) ── */}
        <div className="form-page" style={{paddingTop:24,paddingBottom:48}}>

          {/* 01 PROJECT TYPE */}
          <section className="form-section fade-up-delay">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-badge project-badge">🏗️ Project</span>
                <span className="section-num">01</span>
                Project Type
              </h2>
            </div>
            <div className="project-type-grid">
              {['2BHK','3BHK','4BHK','Villa','Commercial Project','Others'].map(type => (
                <label key={type} className={`project-type-card ${projectType===type?'selected':''}`}>
                  <input type="radio" name="editProjectType" value={type} checked={projectType===type} onChange={()=>setProjectType(type)} />
                  <span className="project-type-icon">{type==='2BHK'?'🏠':type==='3BHK'?'🏠':type==='4BHK'?'🏡':type==='Villa'?'🏰':type==='Commercial Project'?'🏢':'📋'}</span>
                  <span className="project-type-label">{type}</span>
                </label>
              ))}
            </div>
          </section>

          {/* 02 CLIENT */}
          <section className="form-section fade-up-delay">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-badge client-badge">👤 Client</span>
                <span className="section-num">02</span>
                Client Details
              </h2>
            </div>
            <div className="person-grid three-col">
              <div className="field-group">
                <label className="field-label">Full Name <span className="req">*</span></label>
                <input className="field-input" placeholder="Mr. Sudharshan" value={clientName} onChange={e=>setClientName(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Phone Number <span className="req">*</span></label>
                <input className="field-input" placeholder="9000700930" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Alternate Phone</label>
                <input className="field-input" placeholder="9100000000" value={clientAltPhone} onChange={e=>setClientAltPhone(e.target.value)} />
              </div>
              <div className="field-group full-width">
                <label className="field-label">Full Address</label>
                <input className="field-input" placeholder="House No., Street, Area, City" value={fullAddress} onChange={e=>setFullAddress(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Pincode</label>
                <input className="field-input" placeholder="500032" value={pincode} onChange={e=>setPincode(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Villa / Flat Number</label>
                <input className="field-input" placeholder="Villa 12 / Flat 4B" value={villaNumber} onChange={e=>setVillaNumber(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Site Name / Project Name</label>
                <input className="field-input" placeholder="Aparna Palm Woods" value={siteName} onChange={e=>setSiteName(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Location</label>
                <input className="field-input" placeholder="Kokapet, Hyderabad" value={location} onChange={e=>setLocation(e.target.value)} />
              </div>
            </div>
          </section>

          {/* 03 SITE MANAGER */}
          <section className="form-section fade-up-delay">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-badge sm-badge">🏗️ Manager</span>
                <span className="section-num">03</span>
                Site Manager Details
              </h2>
            </div>
            <div className="person-grid three-col">
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input className="field-input" placeholder="e.g. Chandu" value={smName} onChange={e=>setSmName(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Phone Number</label>
                <input className="field-input" placeholder="9000700910" value={smPhone} onChange={e=>setSmPhone(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Designation</label>
                <input className="field-input" placeholder="e.g. Site Manager" value={smDesignation} onChange={e=>setSmDesignation(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Branch</label>
                <select className="field-input field-select" value={smBranch} onChange={e=>setSmBranch(e.target.value)}>
                  <option value="">— Select Branch —</option>
                  {['Kompally','Medchal','Gachibowli','Bheemavaram'].map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">🗓 Project Start Date</label>
                <input className="field-input" type="date"
                  value={projectStartDate} onChange={e=>setProjectStartDate(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">🏁 Project End Date</label>
                <input className="field-input" type="date"
                  value={projectEndDate} onChange={e=>setProjectEndDate(e.target.value)} />
              </div>
            </div>
          </section>

          {/* 04 INTERIOR WORK */}
          <section className="form-section fade-up-delay-2">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-badge room-badge">🏠 Rooms</span>
                <span className="section-num">04</span>
                Interior Work
              </h2>
              <div className="section-header-right">
                <div className="section-total">Total: <strong>₹{totalInterior.toLocaleString('en-IN')}</strong></div>
                {!showAddRoom ? (
                  <button type="button" className="btn-add-room" onClick={()=>setShowAddRoom(true)}>＋ Add Room</button>
                ) : (
                  <div className="add-room-inline">
                    <input className="add-room-input" placeholder="Room name…" value={newRoomName}
                      onChange={e=>setNewRoomName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addNewRoom())} autoFocus />
                    <button type="button" className="btn-confirm-room" onClick={addNewRoom}>✓</button>
                    <button type="button" className="btn-cancel-room" onClick={()=>{setShowAddRoom(false);setNewRoomName('');}}>✕</button>
                  </div>
                )}
              </div>
            </div>

            {/* Nav overview box */}
            <div className="nav-overview-box">
              <div className="nav-overview-group">
                <div className="nav-overview-group-title">🏠 Rooms</div>
                <div className="nav-overview-grid">
                  {Object.entries(rooms).map(([key,room])=>{
                    const t=room.items.reduce((s,it)=>s+(key==='accessories'?it.nos*it.unitCost:calcItemTotal(it)),0);
                    return (
                      <a key={key} href={"#edit-card-"+key} className="nav-overview-item" style={{'--chip-color':room.color}}>
                        <span className="nav-ov-icon">{ROOM_ICONS[key]||'🚪'}</span>
                        <span className="nav-ov-name">{room.label}</span>
                        <span className="nav-ov-amt">{t===0?'—':'₹'+t.toLocaleString('en-IN')}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="nav-overview-divider" />
              <div className="nav-overview-group">
                <div className="nav-overview-group-title-row">
                  <span className="nav-overview-group-title">📐 Other Works</span>
                  {!showAddSection ? (
                    <button type="button" className="btn-add-section-sm" onClick={()=>setShowAddSection(true)}>＋ Add Section</button>
                  ) : (
                    <div className="add-room-inline">
                      <input className="add-room-input" placeholder="Section name…" value={newSectionName}
                        onChange={e=>setNewSectionName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addNewSection())} autoFocus />
                      <button type="button" className="btn-confirm-room" onClick={addNewSection}>✓</button>
                      <button type="button" className="btn-cancel-room" onClick={()=>{setShowAddSection(false);setNewSectionName('');}}>✕</button>
                    </div>
                  )}
                </div>
                <div className="nav-overview-grid">
                  {Object.entries(sections).map(([key,sec])=>{
                    const t=sectionTotals[key]||0;
                    return (
                      <a key={key} href={"#edit-card-sec_"+key} className="nav-overview-item" style={{'--chip-color':SECTION_COLORS[key]||'#888'}}>
                        <span className="nav-ov-icon">{SECTION_ICONS[key]||'📦'}</span>
                        <span className="nav-ov-name">{sec.label}</span>
                        <span className="nav-ov-amt">{t===0?'—':'₹'+t.toLocaleString('en-IN')}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Room + Section cards */}
            <div className="all-rooms-stack">
              {Object.entries(rooms).map(([key,room])=>{
                const isMin=!!minimized[key];
                const isAcc=key==='accessories';
                const roomTotal=isAcc?room.items.reduce((s,i)=>s+i.nos*i.unitCost,0):room.items.reduce((s,it)=>s+calcItemTotal(it),0);
                return (
                  <div key={key} id={"edit-card-"+key} className={`room-card ${isMin?'minimized':''}`} style={{'--room-color':room.color}}>
                    <div className="room-card-header">
                      <div className="room-card-title">
                        <span className="room-card-icon">{ROOM_ICONS[key]||'🚪'}</span>
                        {room.isCustom
                          ? <input className="room-name-edit" value={room.label} onChange={e=>updateRoomLabel(key,e.target.value)} style={{borderColor:room.color}} />
                          : <span className="room-card-label">{room.label}</span>}
                        <span className="room-card-total" style={{color:room.color}}>{roomTotal===0?'—':'₹'+roomTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="room-card-actions">
                        {!isAcc && (
                          <div className="pdf-upload-wrap">
                            <input type="file" accept=".pdf" style={{display:'none'}}
                              ref={el=>fileInputRefs.current[key]=el}
                              onChange={e=>handlePdfUpload(key,e.target.files[0])} />
                            <button type="button" className={`btn-upload-pdf ${room.pdfName||room.pdfBase64?'has-file':''}`}
                              onClick={()=>fileInputRefs.current[key]?.click()}>
                              📎 {room.pdfName?room.pdfName.slice(0,16)+(room.pdfName.length>16?'…':''):'Attach PDF'}
                            </button>
                            {(room.pdfName||room.pdfBase64)&&(
                              <>
                                {room.pdfBase64&&!room.pdfFile&&(
                                  <button type="button" className="btn-upload-pdf has-file" style={{fontSize:11,padding:'4px 8px'}}
                                    onClick={()=>{const a=document.createElement('a');a.href=(room.pdfBase64.startsWith('data:')?room.pdfBase64:'data:application/pdf;base64,'+room.pdfBase64);a.download=room.pdfName||'attachment.pdf';a.click();}}>
                                    ↓ View
                                  </button>
                                )}
                                <button type="button" className="btn-remove-pdf" onClick={()=>setRooms(prev=>({...prev,[key]:{...prev[key],pdfFile:null,pdfName:'',pdfBase64:null}}))}>✕</button>
                              </>
                            )}
                          </div>
                        )}
                        <button type="button" className="btn-add-item" onClick={()=>addItem(key)}>+ Add Item</button>
                        <button type="button" className="btn-delete-room" onClick={()=>{if(window.confirm(`Delete "${room.label}"?`))deleteRoom(key);}}>🗑 Delete</button>
                        <button type="button" className="btn-minimize" onClick={()=>toggleMinimize(key)}>{isMin?'＋':'−'}</button>
                      </div>
                    </div>
                    {!isMin&&(
                      isAcc?(
                        <div className="item-table-wrap">
                          <table className="item-table">
                            <thead><tr><th>Item</th><th>Nos / Qty</th><th>Unit Cost (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th></tr></thead>
                            <tbody>
                              {room.items.map((item,idx)=>(
                                <tr key={idx} className="item-row">
                                  <td><input className="cell-input" value={item.name} onChange={e=>updateItem('accessories',idx,'name',e.target.value)} /></td>
                                  <td><input type="text" inputMode="numeric" className="cell-input num" value={item.nos} onChange={e=>updateItem('accessories',idx,'nos',+e.target.value)} /></td>
                                  <td><input type="text" inputMode="numeric" className="cell-input num" value={item.unitCost} onChange={e=>updateItem('accessories',idx,'unitCost',+e.target.value)} /></td>
                                  <td className="total-cell">₹{(item.nos*item.unitCost).toLocaleString('en-IN')}</td>
                                  <td><input className="cell-input" value={item.remarks} onChange={e=>updateItem('accessories',idx,'remarks',e.target.value)} /></td>
                                  <td><button type="button" className="btn-remove" onClick={()=>removeItem('accessories',idx)}>✕</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ):(
                        <div className="item-table-wrap">
                          <table className="item-table">
                            <thead><tr><th>Particulars</th><th>W (in)</th><th>H (in)</th><th>Nos</th><th>Area sft</th><th>Type</th><th>Rate (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th></tr></thead>
                            <tbody>
                              {room.items.map((item,idx)=>{
                                const isSft = item.type === 'SFT';
                                return (
                                <tr key={idx} className="item-row">
                                  <td><input className="cell-input" value={item.name} onChange={e=>updateItem(key,idx,'name',e.target.value)} /></td>
                                  <td>{isSft ? <span style={{color:'#bbb',fontSize:12}}>—</span> : <NumInput className="cell-input num" value={item.width}    onChange={v=>updateItem(key,idx,'width',v)} />}</td>
                                  <td>{isSft ? <span style={{color:'#bbb',fontSize:12}}>—</span> : <NumInput className="cell-input num" value={item.height}   onChange={v=>updateItem(key,idx,'height',v)} />}</td>
                                  <td><NumInput className="cell-input num" value={item.nos} onChange={v=>updateItem(key,idx,'nos',v)} /></td>
                                  <td className="calc-cell">{isSft ? <NumInput className="cell-input num" value={item.sft} onChange={v=>updateItem(key,idx,'sft',v)} placeholder="SFT" /> : (calcItemArea(item)||'—')}</td>
                                  <td><select className="cell-select" value={item.type} onChange={e=>updateItem(key,idx,'type',e.target.value)}>{['BOX','FRAME','PANELLING','GLASS','SFT','FIXED','Wall','PROFILE WITH MIRROR','PROFILE WITH GLASS','DRAWERS','SLIDING KIT'].map(t=><option key={t}>{t}</option>)}</select></td>
                                  <td><NumInput className="cell-input num" value={item.unitCost} onChange={v=>updateItem(key,idx,'unitCost',v)} /></td>
                                  <td className="total-cell">₹{calcItemTotal(item).toLocaleString('en-IN')}</td>
                                  <td><input className="cell-input" value={item.remarks} onChange={e=>updateItem(key,idx,'remarks',e.target.value)} /></td>
                                  <td><button type="button" className="btn-remove" onClick={()=>removeItem(key,idx)}>✕</button></td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {/* Section cards */}
              {Object.entries(sections).map(([key,sec])=>{
                const isMin=!!minimized['sec_'+key];
                const secTotal=sectionTotals[key]||0;
                return (
                  <div key={key} id={"edit-card-sec_"+key} className={`room-card section-card ${isMin?'minimized':''}`} style={{'--room-color':SECTION_COLORS[key]||'#888'}}>
                    <div className="room-card-header">
                      <div className="room-card-title">
                        <span className="room-card-icon">{SECTION_ICONS[key]||'📦'}</span>
                        <span className="room-card-label">{sec.label}</span>
                        <span className="room-card-total" style={{color:SECTION_COLORS[key]||'#888'}}>{secTotal===0?'—':'₹'+secTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="room-card-actions">
                        <button type="button" className="btn-add-item" onClick={()=>addSecRow(key)}>+ Add Row</button>
                        <button type="button" className="btn-delete-room" onClick={()=>{if(window.confirm(`Delete "${sec.label}"?`))setSections(prev=>{const n={...prev};delete n[key];return n;});}}>🗑 Delete</button>
                        <button type="button" className="btn-minimize" onClick={()=>toggleMinimize('sec_'+key)}>{isMin?'＋':'−'}</button>
                      </div>
                    </div>
                    {!isMin&&(
                      <div className="item-table-wrap">
                        <table className="item-table">
                          <thead><tr><th>Particulars</th><th>W (in)</th><th>H (in)</th><th>Nos</th><th>Area sft</th><th>Type</th><th>Rate (₹)</th><th>Total (₹)</th><th>Remarks</th><th></th></tr></thead>
                          <tbody>
                            {sec.items.map((item,idx)=>{
                              const isSft = item.type === 'SFT';
                              const _w = parseFloat(item.width)||0, _h = parseFloat(item.height)||0, _n = parseFloat(item.nos)||0;
                              const whArea = (item.type!=='FIXED' && _w && _h && _n) ? parseFloat(((_w*_h*_n)/144).toFixed(2)) : 0;
                              return (
                              <tr key={idx} className="item-row">
                                <td><input className="cell-input" value={item.name} onChange={e=>updateSec(key,idx,'name',e.target.value)} /></td>
                                <td>{isSft ? <span style={{color:'#bbb',fontSize:12}}>—</span> : <NumInput className="cell-input num" value={item.width}    onChange={v=>updateSec(key,idx,'width',v)} />}</td>
                                <td>{isSft ? <span style={{color:'#bbb',fontSize:12}}>—</span> : <NumInput className="cell-input num" value={item.height}   onChange={v=>updateSec(key,idx,'height',v)} />}</td>
                                <td><NumInput className="cell-input num" value={item.nos} onChange={v=>updateSec(key,idx,'nos',v)} /></td>
                                <td className="calc-cell">{item.type==='FIXED' ? 'Fixed' : <NumInput className="cell-input num" value={item.sft} onChange={v=>updateSec(key,idx,'sft',v)} placeholder={whArea>0?String(whArea):'SFT'} />}</td>
                                <td><select className="cell-select" value={item.type} onChange={e=>updateSec(key,idx,'type',e.target.value)}>{['BOX','FRAME','PANELLING','GLASS','SFT','FIXED','PROFILE WITH MIRROR','PROFILE WITH GLASS','DRAWERS','SLIDING KIT'].map(t=><option key={t}>{t}</option>)}</select></td>
                                <td><NumInput className="cell-input num" value={item.unitCost} onChange={v=>updateSec(key,idx,'unitCost',v)} /></td>
                                <td className="total-cell">₹{calcItemTotal(item).toLocaleString('en-IN')}</td>
                                <td><input className="cell-input" value={item.remarks} onChange={e=>updateSec(key,idx,'remarks',e.target.value)} /></td>
                                <td><button type="button" className="btn-remove" onClick={()=>removeSecRow(key,idx)}>✕</button></td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 05 SUMMARY */}
          <section className="form-section summary-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-badge summary-badge">📊 Summary</span>
                <span className="section-num">05</span>
                Cost Summary
              </h2>
            </div>
            <div className="summary-grid">
              {Object.entries(rooms).map(([key,room])=>(
                <div key={key} className="summary-item" style={{'--color':room.color}}>
                  <span className="summary-room">{room.label}</span>
                  <span className="summary-val">₹{room.items.reduce((s,it)=>s+(key==='accessories'?it.nos*it.unitCost:calcItemTotal(it)),0).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {Object.entries(sections).map(([key,sec])=>(
                <div key={key} className={`summary-item summary-${key}-item`}>
                  <span className="summary-room">{sec.label}</span>
                  <span className="summary-val">₹{(sectionTotals[key]||0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            {/* T&C */}
            <div className="tc-block">
              <div className="tc-header">
                <span className="tc-title">📋 Terms &amp; Conditions</span>
                <span className="tc-count">{tcItems.length} items</span>
              </div>
              <ol className="tc-list">
                {tcItems.map((item,idx)=>(
                  <li key={idx} className="tc-item">
                    <span className="tc-text">{item}</span>
                    <button type="button" className="tc-remove" onClick={()=>setTcItems(prev=>prev.filter((_,i)=>i!==idx))}>✕</button>
                  </li>
                ))}
              </ol>
              <div className="tc-add-row">
                <input className="tc-input" placeholder="Add a new term or condition…" value={newTcText}
                  onChange={e=>setNewTcText(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const t=newTcText.trim();if(t){setTcItems(prev=>[...prev,t]);setNewTcText('');}}}} />
                <button type="button" className="tc-add-btn"
                  onClick={()=>{const t=newTcText.trim();if(t){setTcItems(prev=>[...prev,t]);setNewTcText('');}}}>+ Add</button>
              </div>
            </div>

            {/* NOTE POINTS */}
            <div className="tc-block">
              <div className="tc-header">
                <span className="tc-title">📝 Note Points</span>
                <span className="tc-count">{noteItems.length} items</span>
              </div>
              <ol className="tc-list">
                {noteItems.map((item,idx)=>(
                  <li key={idx} className="tc-item">
                    <span className="tc-text">{item}</span>
                    <button type="button" className="tc-remove" onClick={()=>setNoteItems(prev=>prev.filter((_,i)=>i!==idx))}>✕</button>
                  </li>
                ))}
              </ol>
              <div className="tc-add-row">
                <input className="tc-input" placeholder="Add a new note point…" value={newNoteText}
                  onChange={e=>setNewNoteText(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();const t=newNoteText.trim();if(t){setNoteItems(prev=>[...prev,t]);setNewNoteText('');}}}} />
                <button type="button" className="tc-add-btn"
                  onClick={()=>{const t=newNoteText.trim();if(t){setNoteItems(prev=>[...prev,t]);setNewNoteText('');}}}>+ Add</button>
              </div>
            </div>

            <div className="totals-block">
              <div className="total-row subtotal-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="total-row gst-row">
                <span className="gst-label-wrap">Discount
                  <div className="gst-edit-wrap">
                    <input type="text" inputMode="numeric" className="gst-input" value={discountPercent} min="0" max="100" placeholder="0" onChange={e=>setDiscountPercent(parseFloat(e.target.value)||0)} />
                    <span className="gst-pct-sym">%</span>
                  </div>
                </span>
                <span className="gst-amount-val" style={{color:'#10B981'}}>- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
              {discountPercent > 0 && (
                <div className="total-row" style={{opacity:0.75}}>
                  <span>After Discount</span><span>₹{afterDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="total-row gst-row">
                <span className="gst-label-wrap">GST
                  <div className="gst-edit-wrap">
                    <input type="text" inputMode="numeric" className="gst-input" value={gstPercent} min="0" max="100" placeholder="0" onChange={e=>setGstPercent(parseFloat(e.target.value)||0)} />
                    <span className="gst-pct-sym">%</span>
                  </div>
                </span>
                <span className="gst-amount-val">+ ₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="total-row grand-total-row">
                <span>Grand Total
                  {discountPercent > 0 && <span className="gst-incl-note"> ({discountPercent}% disc)</span>}
                  {gstPercent > 0 && <span className="gst-incl-note"> (incl. {gstPercent}% GST)</span>}
                </span>
                <span className="gt-number">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn-payment" onClick={()=>setShowPaymentModal(true)}>💳 Payment Schedule</button>
            <button type="button" className="btn-submit" onClick={handleSave} disabled={saving}>
              {saving?(<span className="btn-loading"><span className="spinner"></span> Saving...</span>):(<>💾 Save &amp; Close</>)}
            </button>
          </div>

          {showPaymentModal && ReactDOM.createPortal(
            <PaymentModal
              payStages={payStages}
              setPayStages={setPayStages}
              onClose={()=>setShowPaymentModal(false)}
              clientName={clientName}
              smName={smName}
              grandTotal={grandTotal}
              quotationId={data.id}
            />,
            document.body
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN LIST
══════════════════════════════════════════════════════════════ */
// Format large amounts compactly
const fmtAmt = (n) => {
  const v = parseFloat(n) || 0;
  if (v >= 10000000) return '₹' + (v/10000000).toFixed(2).replace(/\.?0+$/,'') + ' Cr';
  if (v >= 100000)   return '₹' + (v/100000).toFixed(2).replace(/\.?0+$/,'')  + ' L';
  if (v >= 1000)     return '₹' + (v/1000).toFixed(1).replace(/\.?0+$/,'')    + 'K';
  return '₹' + v.toLocaleString('en-IN');
};

export default function QuotationList({ user = { role: 'admin' } }) {
  const navigate = useNavigate();
  // Role permissions
  const isAdmin   = user.role === 'admin';
  const isManager = user.role === 'manager';
  const canCreate = true; // all roles can create
  const canDelete = isAdmin;
  // Per-quotation permission checks (pass the quotation object)
  const isUnbooked      = (q) => (q.project_status||'Unbooked') === 'Unbooked';
  const canEdit         = (q) => isAdmin || (isManager && (isUnbooked(q) || approvedEdits.includes(q.id))); // admin can edit ALL

  // Action button style helper
  const actBtn = (bg, color) => ({
    width:32, height:32, borderRadius:8, border:`1.5px solid ${color}22`,
    background:bg, color:color, fontSize:14, cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all 0.15s', flexShrink:0, padding:0,
    boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
  });
  // Admin can change status freely; non-admins cannot change a Booked project back
  const canChangeStatus = (q) => isAdmin || isUnbooked(q);

  const [quotations,    setQuotations]    = useState([]);
  const [statusFilter,  setStatusFilter]  = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [ccReady,    setCcReady]    = useState(false); // triggers CompletionBar re-render after bulk fetch
  const [selected,   setSelected]   = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [paymentQ,   setPaymentQ]   = useState(null);  // quotation for payment modal
  const [search,     setSearch]     = useState('');
  const [filterBranch,  setFilterBranch]  = useState('All');
  const [filterManager, setFilterManager] = useState('All');
  const [filterFrom,    setFilterFrom]    = useState('');
  const [filterTo,      setFilterTo]      = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [showProjectMgmt,     setShowProjectMgmt]     = useState(false);
  const [showEditReqPanel,    setShowEditReqPanel]    = useState(false);
  const [showPayDelPanel,     setShowPayDelPanel]     = useState(false);
  const [visitReportQ,        setVisitReportQ]        = useState(null);  // quotation for visit report
  const [completionQ,         setCompletionQ]         = useState(null);  // quotation for completion status  // admin: view requests
  const [editRequestModal,    setEditRequestModal]    = useState(null);   // manager: send request {quotation}
  const [approvedEdits,       setApprovedEdits]       = useState([]);     // quotation_ids manager can edit
  const [pmProjectId,         setPmProjectId]          = useState(null); // pre-select a project in PM modal

  const fetchAll = async () => {
    try { const res=await api.get(`/quotations`); setQuotations(res.data.data||[]); } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch quotations';
      console.error('fetchAll error:', msg, err);
      toast.error(msg);
    }
    setLoading(false);
    // Bulk-load all completion % in one request so CompletionBar reads from cache instantly
    try {
      const cr = await api.get('/completion-status-bulk');
      const map = cr.data.data || {};
      Object.entries(map).forEach(([id, pct]) => { _cc[Number(id)] = typeof pct === 'number' ? pct : 0; });
      setCcReady(true);
    } catch { setCcReady(true); }
  };
  useEffect(()=>{ fetchAll(); },[]);

  const handleView     = async (id) => { try { const res=await api.get(`/quotations/${id}`); setSelected(res.data.data); } catch { toast.error('Failed to load'); } };
  const handleEdit     = async (id) => { try { const res=await api.get(`/quotations/${id}`); setEditing(res.data.data);  } catch { toast.error('Failed to load'); } };
  const handleEditSaved= (freshData) => {
    fetchAll();
    if (freshData) {
      // Small delay so EditModal fully unmounts before ViewModal opens
      setTimeout(() => setSelected({...freshData, _ts: Date.now()}), 50);
    }
  };
  const handlePayment  = async (id) => {
    try {
      const res = await api.get(`/quotations/${id}`);
      setPaymentQ(res.data.data);
    } catch { toast.error('Failed to load'); }
  };
  const handleDelete   = async (id) => { if (!canDelete) { toast.error('Only admins can delete quotations'); return; } if (!window.confirm('Delete this quotation?')) return; try { await api.delete(`/quotations/${id}`); toast.success('Deleted'); fetchAll(); } catch (err) { toast.error(err?.response?.data?.message || 'Failed to delete quotation'); } };
  const handleStatusChange = async (id, status) => {
    // Admin can change ANY status freely
    // Non-admins cannot change Booked projects back
    const current = quotations.find(q => q.id === id);
    if (!isAdmin && (current?.project_status || 'Unbooked') === 'Booked') {
      toast.error('🔒 This project is Booked. Request admin to change status.');
      return;
    }
    // Optimistically update UI
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, project_status: status } : q));
    try {
      await api.patch(`/quotations/${id}/status`, { project_status: status, role: user.role });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      // Revert on failure
      fetchAll();
      const msg = err.response?.data?.message || err.message || 'Failed to update status';
      toast.error(msg);
      console.error('Status update error:', err.response?.status, msg);
    }
  };

  const handleDownload = async (id) => {
    const res=await api.get(`/quotations/${id}`); const d=res.data.data;
    toast.loading('Generating…',{id:'dl'});
    try { const blob=await pdf(<QuotationPDF data={d}/>).toBlob(); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Deeraj_Quotation_${d.customer_name.replace(/\s+/g,'_')}_${id}.pdf`; a.click(); URL.revokeObjectURL(url); toast.success('Downloaded!',{id:'dl'}); } catch { toast.error('Failed',{id:'dl'}); }
  };
  const handlePrint    = async (id) => {
    const res=await api.get(`/quotations/${id}`); const d=res.data.data;
    toast.loading('Generating PDF…',{id:'pr'});
    try {
      const blob=await pdf(<QuotationPDF data={d}/>).toBlob();
      const url=URL.createObjectURL(blob);
      const w=window.open(url,'_blank');
      if(w){ w.onload=()=>{ w.print(); }; }
      toast.success('Ready to print!',{id:'pr'});
      setTimeout(()=>URL.revokeObjectURL(url), 60000);
    } catch { toast.error('Failed',{id:'pr'}); }
  };

  // Derive unique branches and managers for filter dropdowns
  const allBranches  = [...new Set(quotations.map(q=>q.site_manager_branch||'').filter(Boolean))].sort();
  const allManagers  = [...new Set(quotations.map(q=>q.site_manager_name||'').filter(Boolean))].sort();

  const filtered = [...quotations].sort((a,b) => {
    // Booked first, then Unbooked
    const aBooked = (a.project_status||'Unbooked') === 'Booked' ? 0 : 1;
    const bBooked = (b.project_status||'Unbooked') === 'Booked' ? 0 : 1;
    if (aBooked !== bBooked) return aBooked - bBooked;
    // Within same status, newest first
    return new Date(b.created_at||0) - new Date(a.created_at||0);
  }).filter(q=> {
    const matchSearch =
      (q.customer_name||'').toLowerCase().includes(search.toLowerCase())||
      (q.location||'').toLowerCase().includes(search.toLowerCase())||
      (q.mobile||'').includes(search);
    const matchStatus  = statusFilter === 'All' || (q.project_status||'Unbooked') === statusFilter;
    const matchBranch  = filterBranch  === 'All' || (q.site_manager_branch||'') === filterBranch;
    const matchManager = filterManager === 'All' || (q.site_manager_name||'')   === filterManager;
    const createdDate  = new Date(q.created_at);
    const matchFrom    = !filterFrom   || createdDate >= new Date(filterFrom);
    const matchTo      = !filterTo     || createdDate <= new Date(filterTo + 'T23:59:59');
    const gt           = Number(q.grand_total||0);
    const matchBudgMin = !filterBudgetMin || gt >= Number(filterBudgetMin);
    const matchBudgMax = !filterBudgetMax || gt <= Number(filterBudgetMax);
    return matchSearch && matchStatus && matchBranch && matchManager && matchFrom && matchTo && matchBudgMin && matchBudgMax;
  });

  // Cards computed from filtered — all roles see all quotations
  const cardBase = filtered;

  const bookedQ      = cardBase.filter(q=>(q.project_status||'Unbooked')==='Booked');
  const unbookedQ    = cardBase.filter(q=>(q.project_status||'Unbooked')==='Unbooked');
  const bookedCount  = bookedQ.length;
  const unbookedCount= unbookedQ.length;

  const totalGrand         = cardBase.reduce((s,q)=>s+(parseFloat(q.grand_total)||0),0);
  const totalPaid          = cardBase.reduce((s,q)=>s+(parseFloat(q.paid_total)||0),0);
  const totalBalance       = totalGrand - totalPaid;

  const totalBookedAmt     = bookedQ.reduce((s,q)=>s+(parseFloat(q.grand_total)||0),0);
  const totalUnbookedAmt   = unbookedQ.reduce((s,q)=>s+(parseFloat(q.grand_total)||0),0);
  const totalBookedPaid    = bookedQ.reduce((s,q)=>s+(parseFloat(q.paid_total)||0),0);
  const totalBookedBalance = totalBookedAmt - totalBookedPaid;

  // Calculate SFT from rooms data directly (works even if total_sft not saved yet)
  const calcSftFromRooms = (q) => {
    // First try saved total_sft field
    if (parseFloat(q.total_sft) > 0) return parseFloat(q.total_sft);
    // Otherwise calculate from rooms JSON
    try {
      const rooms = typeof q.rooms === 'string' ? JSON.parse(q.rooms) : q.rooms;
      if (!rooms || typeof rooms !== 'object') return 0;
      let sft = 0;
      for (const [key, room] of Object.entries(rooms)) {
        if (key === 'accessories' || !room.items) continue;
        for (const item of room.items) {
          if (item.type === 'FIXED') continue;
          const w = parseFloat(item.width) || 0;
          const h = parseFloat(item.height) || 0;
          const n = parseFloat(item.nos) || 0;
          if (w && h && n) sft += (w * h * n) / 144;
        }
      }
      return parseFloat(sft.toFixed(2));
    } catch { return 0; }
  };
  const totalSft = parseFloat(bookedQ.reduce((s,q) => s + calcSftFromRooms(q), 0).toFixed(2));
  const fmtSft   = (v) => {
    if (!v) return '0 SFT';
    if (v >= 10000) return (v/1000).toFixed(1) + 'K SFT';
    return v.toLocaleString('en-IN') + ' SFT';
  };

  const hasFilters = filterBranch!=='All'||filterManager!=='All'||filterFrom||filterTo||filterBudgetMin||filterBudgetMax;
  const clearFilters = () => { setFilterBranch('All');setFilterManager('All');setFilterFrom('');setFilterTo('');setFilterBudgetMin('');setFilterBudgetMax(''); };

  return (
    <div className="list-page fade-up">
      {showProjectMgmt && (
        <ProjectManagement
          onClose={() => { setShowProjectMgmt(false); setPmProjectId(null); }}
          preSelectedProjectId={pmProjectId}
        />
      )}
      {paymentQ && ReactDOM.createPortal(
        <PaymentTransactionsModal quotation={paymentQ} onClose={()=>setPaymentQ(null)} onPaymentSaved={fetchAll} user={user} />,
        document.body
      )}
      {selected && <ViewModal key={selected.id+'_'+(selected.updated_at||selected.created_at||Math.random())} data={selected} onClose={()=>setSelected(null)} canDelete={canDelete} onDelete={(id)=>{ handleDelete(id); setSelected(null); }}/>}
      {editing  && <EditModal data={editing}  onClose={()=>setEditing(null)} onSaved={handleEditSaved} canDelete={canDelete} onDelete={(id)=>{ handleDelete(id); setEditing(null); }}/>}
      {editRequestModal && (
        <EditRequestModal
          quotation={editRequestModal}
          user={user}
          onClose={()=>setEditRequestModal(null)}
          onSent={()=>{}}
        />
      )}
      {showEditReqPanel && (
        <AdminRequestsPanel
          onClose={()=>setShowEditReqPanel(false)}
          onApproved={fetchAll}
        />
      )}
      {showPayDelPanel && (
        <AdminPayDeletePanel
          onClose={()=>setShowPayDelPanel(false)}
          onActioned={fetchAll}
        />
      )}
      {visitReportQ && (
        <VisitReportModal
          quotation={visitReportQ}
          user={user}
          onClose={()=>setVisitReportQ(null)}
        />
      )}
      {completionQ && (
        <CompletionStatusModal
          quotation={completionQ}
          user={user}
          onClose={()=>setCompletionQ(null)}
        />
      )}

      {isManager && (
        <div style={{margin:'0 0 14px',padding:'10px 20px',background:'#EFF6FF',border:'1.5px solid #BFDBFE',borderRadius:10,display:'flex',alignItems:'center',gap:10,fontFamily:"'DM Sans',sans-serif",fontSize:13,color:'#1D4ED8',fontWeight:600}}>
          🏗️ You are logged in as <strong>Site Manager</strong>. You can <strong>edit</strong> Unbooked projects. For Booked projects, click the <strong>🔓</strong> button to request edit permission from admin.
        </div>
      )}
      <div className="list-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">{hasFilters ? `${filtered.length} of ${quotations.length} records` : `${quotations.length} total records`}</p></div>
        <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
          <div className="list-search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="#888" strokeWidth="1.3"/><path d="M9.5 9.5L12 12" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <input className="list-search" placeholder="Search by name, location or mobile…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          {canCreate && (
            <button onClick={()=>navigate('/new')}
              style={{display:'flex',alignItems:'center',gap:'7px',padding:'11px 20px',background:'#E8471C',color:'#fff',border:'none',borderRadius:'10px',fontFamily:"'DM Sans',sans-serif",fontSize:'14px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(232,71,28,0.35)',transition:'all 0.2s',flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.background='#C73A14';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#E8471C';e.currentTarget.style.transform='none';}}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2V13M2 7.5H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              New Quotation
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowEditReqPanel(true)}
              style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',
                background:'#FEF9E6',color:'#B45309',border:'2px solid #FCD34D',
                borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:14,
                fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
              📋 Edit Requests
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowPayDelPanel(true)}
              style={{display:'flex',alignItems:'center',gap:7,padding:'10px 18px',
                background:'#FFF0F0',color:'#B91C1C',border:'2px solid #FECACA',
                borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:14,
                fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
              🗑️ Pay Delete Req
            </button>
          )}
          {(isManager || isAdmin) && (
            <button
              onClick={() => { setPmProjectId(null); setShowProjectMgmt(true); }}
              style={{display:'flex',alignItems:'center',gap:'7px',padding:'11px 20px',
                background:'linear-gradient(135deg,#1A1A1A 0%,#2d1200 100%)',
                color:'#fff',border:'none',borderRadius:'10px',
                fontFamily:"'DM Sans',sans-serif",fontSize:'14px',fontWeight:'700',
                cursor:'pointer',whiteSpace:'nowrap',
                boxShadow:'0 4px 14px rgba(232,71,28,0.25)',
                transition:'all 0.2s',flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';}}>
              📋 Project Management
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Cards — 5 per row ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:18}}>

        {/* ── Row 1: Counts ── */}
        {[
          { icon:'📋', bg:'#FFF0EC', label:'Total Quotations', value: cardBase.length,  color:'#E8471C', sub: hasFilters?`of ${quotations.length} total`:null },
          { icon:'✅', bg:'#EFF6FF', label:'Booked Projects',   value: bookedCount,    color:'#1D4ED8' },
          { icon:'🔘', bg:'#FFF5F5', label:'Unbooked Projects', value: unbookedCount,  color:'#EF4444' },
          { icon:'💰', bg:'#F0FDF4', label:'Total Amount',      value: fmtAmt(totalGrand),   color:'#10B981', isMoney:true },
          { icon:'📐', bg:'#F5F3FF', label:'Booked SFT',        value: fmtSft(totalSft),     color:'#7C3AED', isMoney:false },
        ].map((c,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.07)',border:'1.5px solid #F0F0F0',display:'flex',alignItems:'center',gap:14,minHeight:90}}>
            <div style={{width:52,height:52,borderRadius:12,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>{c.label}</div>
              <div style={{fontSize:c.isMoney?18:26,fontWeight:800,color:c.color,fontFamily:"'DM Sans',sans-serif",lineHeight:1,wordBreak:'break-all'}}>{c.value}</div>
              {c.sub&&<div style={{fontSize:10,color:'#AAA',marginTop:3}}>{c.sub}</div>}
            </div>
          </div>
        ))}

        {/* ── Row 2: Amounts + Booked Breakdown ── */}
        {[
          { icon:'⏳', bg:'#FFF5F5', label:'Total Balance',     value: fmtAmt(totalBalance),       color:'#EF4444', isMoney:true },
          { icon:'🏠', bg:'#EFF6FF', label:'Booked Amount',     value: fmtAmt(totalBookedAmt),     color:'#1D4ED8', isMoney:true },
          { icon:'📦', bg:'#FFF8F0', label:'Unbooked Amount',   value: fmtAmt(totalUnbookedAmt),   color:'#F97316', isMoney:true },
          { icon:'✅', bg:'#F0FDF4', label:'Booked Paid',       value: fmtAmt(totalBookedPaid),    color:'#10B981', isMoney:true },
          { icon:'🔴', bg:'#FFF0F0', label:'Booked Balance',    value: fmtAmt(totalBookedBalance), color:'#EF4444', isMoney:true },
        ].map((c,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:14,padding:'18px 20px',boxShadow:'0 2px 12px rgba(0,0,0,0.07)',border:'1.5px solid #F0F0F0',display:'flex',alignItems:'center',gap:14,minHeight:90}}>
            <div style={{width:52,height:52,borderRadius:12,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:'#888',fontWeight:600,marginBottom:4,fontFamily:"'DM Sans',sans-serif"}}>{c.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:c.color,fontFamily:"'DM Sans',sans-serif",lineHeight:1,wordBreak:'break-all'}}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{background:'#F8F9FB',border:'1.5px solid #E5E5E5',borderRadius:12,padding:'14px 18px',marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:13,color:'#1A1A1A',display:'flex',alignItems:'center',gap:6}}>
            🔍 Filters
            {hasFilters&&<span style={{background:'#E8471C',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:20}}>{[filterBranch!=='All',filterManager!=='All',!!filterFrom,!!filterTo,!!filterBudgetMin,!!filterBudgetMax].filter(Boolean).length} active</span>}
          </div>
          {hasFilters&&<button onClick={clearFilters} style={{background:'none',border:'1.5px solid #E8471C',borderRadius:6,padding:'3px 10px',fontSize:11,color:'#E8471C',fontWeight:700,cursor:'pointer'}}>✕ Clear All</button>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
          {/* Branch */}
          <div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>BRANCH</label>
            <select value={filterBranch} onChange={e=>setFilterBranch(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}>
              <option value="All">All Branches</option>
              {allBranches.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Manager */}
          {isAdmin&&<div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>MANAGER</label>
            <select value={filterManager} onChange={e=>setFilterManager(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}>
              <option value="All">All Managers</option>
              {allManagers.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>}
          {/* From Date */}
          <div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>FROM DATE</label>
            <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}/>
          </div>
          {/* To Date */}
          <div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>TO DATE</label>
            <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}/>
          </div>
          {/* Budget Min */}
          <div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>BUDGET MIN (₹)</label>
            <input type="number" placeholder="0" value={filterBudgetMin} onChange={e=>setFilterBudgetMin(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}/>
          </div>
          {/* Budget Max */}
          <div>
            <label style={{fontSize:10,fontWeight:700,color:'#888',display:'block',marginBottom:3,letterSpacing:0.5}}>BUDGET MAX (₹)</label>
            <input type="number" placeholder="Any" value={filterBudgetMax} onChange={e=>setFilterBudgetMax(e.target.value)}
              style={{width:'100%',border:'1.5px solid #E0E0E0',borderRadius:7,padding:'7px 10px',fontSize:12,fontFamily:"'DM Sans',sans-serif",background:'#fff',color:'#1A1A1A',outline:'none'}}/>
          </div>
        </div>
      </div>

      {/* ── Status Filter ── */}
      <div className="dash-filter-row">
        {['All','Booked','Unbooked'].map(s => (
          <button key={s} className={`dash-filter-btn ${statusFilter===s?'active':''}`}
            onClick={()=>setStatusFilter(s)}>
            {s === 'All' ? '🗂 All' : s === 'Booked' ? '✅ Booked' : '🔘 Unbooked'}
            <span className="dash-filter-count">
              {s==='All' ? filtered.length : filtered.filter(q=>(q.project_status||'Unbooked')===s).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Booked Projects quick panel ── */}
      {(isManager || isAdmin) && !loading && bookedQ.length > 0 && (
        <div style={{marginBottom:20,background:'linear-gradient(135deg,#fff8f5,#fff)',
          border:'2px solid rgba(232,71,28,0.2)',borderRadius:14,overflow:'hidden',
          boxShadow:'0 2px 12px rgba(232,71,28,0.08)'}}>
          <div style={{padding:'14px 20px',background:'linear-gradient(135deg,#1A1A1A,#2d1200)',
            display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>🏗️</span>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:'#fff',fontFamily:"'DM Sans',sans-serif"}}>
                  {isAdmin ? '📊 All Active Projects' : '🏗️ My Active Projects'}
                </div>
                <div style={{fontSize:11,color:'#aaa',marginTop:1}}>
                  {bookedQ.length} booked project{bookedQ.length!==1?'s':''} — click to manage
                </div>
              </div>
            </div>
            <button onClick={() => { setPmProjectId(null); setShowProjectMgmt(true); }}
              style={{padding:'8px 16px',background:'#E8471C',color:'#fff',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif"}}>
              📋 Open Project Management
            </button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,padding:'16px'}}>
            {bookedQ.map((q, idx) => {
              const paid    = Number(q.paid_total||0);
              const total   = Number(q.grand_total||0);
              const balance = total - paid;
              const paidPct = total > 0 ? Math.round((paid/total)*100) : 0;
              return (
                <div key={q.id}
                  onClick={() => { setPmProjectId(q.id); setShowProjectMgmt(true); }}
                  style={{
                    padding:'22px 24px',
                    borderRadius:14,
                    border:'1.5px solid #f0ece8',
                    cursor:'pointer',
                    transition:'box-shadow 0.18s, transform 0.18s, background 0.15s',
                    background:'#fff',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',
                    display:'flex', flexDirection:'column', gap:0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='#fff8f5'; e.currentTarget.style.boxShadow='0 6px 24px rgba(232,71,28,0.13)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.06)'; e.currentTarget.style.transform='translateY(0)'; }}>

                  {/* Header: client name + BOOKED badge */}
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
                    <div style={{fontWeight:800,fontSize:18,color:'#E8471C',
                      fontFamily:"'DM Sans',sans-serif",lineHeight:1.2,
                      flex:1,minWidth:0,paddingRight:8,
                      wordBreak:'break-word'}}>
                      {q.customer_name}
                    </div>
                    <span style={{background:'rgba(232,71,28,0.1)',color:'#E8471C',
                      padding:'3px 10px',borderRadius:6,fontSize:10,fontWeight:800,
                      flexShrink:0,letterSpacing:0.5}}>
                      BOOKED
                    </span>
                  </div>

                  {/* QID + Site name */}
                  <div style={{fontSize:12,color:'#555',fontWeight:700,marginBottom:2}}>
                    #{q.quotation_id||q.id} · {q.site_name || q.location || '—'}
                  </div>

                  {/* Location */}
                  {q.location && (
                    <div style={{fontSize:11,color:'#999',marginBottom:8}}>{q.location}</div>
                  )}

                  {/* Site Manager */}
                  {q.site_manager_name && (
                    <div style={{fontSize:11,color:'#7C3AED',fontWeight:700,marginBottom:10,
                      display:'flex',alignItems:'center',gap:5}}>
                      <span style={{fontSize:13}}>👷</span>
                      <span>{q.site_manager_name}{q.site_manager_branch ? ` · ${q.site_manager_branch}` : ''}</span>
                    </div>
                  )}

                  {/* Payment progress */}
                  <div style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,
                      color:'#888',marginBottom:4}}>
                      <span style={{fontWeight:600}}>Payment Progress</span>
                      <span style={{fontWeight:800,color:paidPct===100?'#10B981':'#E8471C',fontSize:12}}>{paidPct}%</span>
                    </div>
                    <div style={{height:7,background:'#f0f0f0',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:paidPct+'%',
                        background:paidPct===100?'#10B981':'#E8471C',
                        borderRadius:99,transition:'width 0.5s'}}/>
                    </div>
                  </div>

                  {/* Project completion */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:'#888',fontWeight:600,marginBottom:4}}>Project Completion</div>
                    <CompletionBar key={q.id+'-'+ccReady} quotationId={q.id} />
                  </div>

                  {/* Divider */}
                  <div style={{height:1,background:'#f5f0ec',marginBottom:10}}/>

                  {/* Amounts */}
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:11,color:'#999'}}>Total</span>
                      <span style={{fontWeight:800,fontSize:13,color:'#1a1a1a'}}>₹{Number(total).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:11,color:'#999'}}>Paid</span>
                      <span style={{fontWeight:700,fontSize:12,color:'#10B981'}}>₹{Number(paid).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:11,color:'#999'}}>Due</span>
                      <span style={{fontWeight:700,fontSize:12,color:balance>0?'#E8471C':'#10B981'}}>₹{Number(balance).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {loading ? (
        <div className="loading-state"><div className="loading-spinner"/><p>Loading quotations…</p></div>
      ) : filtered.length===0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><h3>No quotations found</h3><p>{search?'Try a different search':'Create your first quotation using the button above'}</p></div>
      ) : (
        <div className="table-card">
          <table className="list-table">
            <colgroup><col className="col-id"/><col className="col-name"/><col className="col-loc"/><col className="col-mobile"/>{isAdmin&&<col className="col-manager"/>}{isAdmin&&<col style={{minWidth:90}}/>}<col className="col-total"/><col className="col-paid"/><col className="col-balance"/><col className="col-status"/><col className="col-date"/><col className="col-actions" style={{width:110}}/></colgroup>
            <thead><tr><th className="col-id">QID</th><th className="col-name">Customer</th><th className="col-loc">Location</th><th className="col-mobile">Mobile</th>{isAdmin&&<th className="col-manager">Manager</th>}{isAdmin&&<th style={{fontSize:11,minWidth:90}}>Branch</th>}<th className="col-total">Grand Total</th><th className="col-paid">Paid</th><th className="col-balance">Balance</th><th className="col-status">Status</th><th className="col-date" style={{whiteSpace:'nowrap'}}>Date / Project</th><th className="col-actions">Actions</th></tr></thead>
            <tbody>
              {filtered.map((q,idx)=>(
                <tr key={q.id} className="list-row" style={{animationDelay:`${idx*0.04}s`}}>
                  <td className="id-cell col-id" style={{fontWeight:700,color:'#E8471C'}}>#{q.quotation_id||q.id}</td>
                  <td className="name-cell col-name"><div className="name-inner"><div className="name-avatar">{(q.customer_name||'?').charAt(0).toUpperCase()}</div><div style={{display:'flex',flexDirection:'column',minWidth:0}}><span>{q.customer_name||'—'}</span>{q.site_name&&<span style={{fontSize:11,color:'#E8471C',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>🏗️ {q.site_name}</span>}</div></div></td>
                  <td className="loc-cell col-loc"><span className="loc-text">{q.location||'—'}</span></td>
                  <td className="phone-cell col-mobile">{q.mobile}</td>
                  {isAdmin&&<td className="col-manager" style={{fontSize:12,color:'#555',fontWeight:600}}>{q.site_manager_name||'—'}</td>}
                  {isAdmin&&<td style={{fontSize:11,color:'#1D4ED8',fontWeight:600,whiteSpace:'nowrap'}}>{q.site_manager_branch?<span style={{background:'#EFF6FF',padding:'2px 8px',borderRadius:12,fontSize:10}}>{q.site_manager_branch}</span>:'—'}</td>}
                  <td className="total-cell col-total">₹{Number(q.grand_total).toLocaleString('en-IN')}</td>
                  <td className="paid-cell col-paid" style={{color:'#10B981',fontWeight:700}}>
                    {Number(q.paid_total||0) > 0 ? '₹'+Number(q.paid_total).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="col-balance" style={{fontWeight:700,color:Number(q.grand_total)-Number(q.paid_total||0)>0?'#EF4444':'#10B981'}}>
                    {Number(q.grand_total)>0 ? '₹'+(Number(q.grand_total)-Number(q.paid_total||0)).toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="status-cell col-status">
                    {!isAdmin && (q.project_status||'Unbooked') === 'Booked' ? (
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:5,
                        padding:'5px 12px', borderRadius:20,
                        background:'#F0FDF4', border:'1.5px solid #86EFAC',
                        color:'#15803D', fontWeight:700, fontSize:12,
                        cursor:'not-allowed', userSelect:'none',
                      }} title="Only admins can change a Booked project">
                        ✅ Booked <span style={{fontSize:11, opacity:0.7}}>🔒</span>
                      </div>
                    ) : (
                      <select className={`status-select status-${(q.project_status||'Unbooked').toLowerCase()}`}
                        value={q.project_status||'Unbooked'}
                        onChange={e=>handleStatusChange(q.id,e.target.value)}
                        style={{opacity:1,cursor:'pointer'}}>
                        <option value="Booked">✅ Booked</option>
                        <option value="Unbooked">🔘 Unbooked</option>
                      </select>
                    )}
                  </td>
                  <td className="date-cell col-date">
                    <div style={{fontSize:11,color:'#888',marginBottom:3}}>
                      📅 {new Date(q.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {q.project_start_date
                        ? <span style={{fontSize:11,color:'#15803d',fontWeight:700}}>▶ {new Date(q.project_start_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
                        : <span style={{fontSize:10,color:'#ccc'}}>Start: —</span>
                      }
                      {q.project_end_date
                        ? <span style={{fontSize:11,color:'#E8471C',fontWeight:700}}>⏹ {new Date(q.project_end_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span>
                        : <span style={{fontSize:10,color:'#ccc'}}>End: —</span>
                      }
                      {Number(q.total_sft) > 0 && (
                        <span style={{fontSize:10,fontWeight:700,color:'#7C3AED',marginTop:1}}>
                          📐 {Number(q.total_sft).toLocaleString('en-IN')} SFT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="actions-cell col-actions">
                    <ActionDropdown
                      q={q}
                      canEdit={canEdit}
                      isManager={isManager}
                      isAdmin={isAdmin}
                      canDelete={canDelete}
                      approvedEdits={approvedEdits}
                      onView={()=>handleView(q.id)}
                      onEdit={()=>handleEdit(q.id)}
                      onRequestEdit={()=>setEditRequestModal(q)}
                      onPayment={()=>handlePayment(q.id)}
                      onDownload={()=>handleDownload(q.id)}
                      onPrint={()=>handlePrint(q.id)}
                      onDelete={()=>handleDelete(q.id)}
                      onProjectMgmt={(isManager||isAdmin) && q.project_status==='Booked' ? ()=>{ setPmProjectId(q.id); setShowProjectMgmt(true); } : null}
                      onVisitReport={()=>setVisitReportQ(q)}
                      onCompletion={()=>setCompletionQ(q)}
                    />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          <div className="mobile-cards">
            {filtered.map((q,idx)=>(
              <div key={q.id} className="mobile-card" style={{animationDelay:`${idx*0.04}s`}}>
                <div className="mc-top"><div className="mc-avatar">{(q.customer_name||'?').charAt(0).toUpperCase()}</div><div className="mc-info"><div className="mc-name">{q.customer_name||'—'}</div>{q.site_name&&<div style={{fontSize:11,color:'#E8471C',fontWeight:600}}>🏗️ {q.site_name}</div>}<div className="mc-id">QID #{q.quotation_id||q.id}</div></div><div>
                  <div className="mc-total">₹{Number(q.grand_total).toLocaleString('en-IN')}</div>
                  {Number(q.paid_total||0)>0 && <div style={{fontSize:11,color:'#10B981',fontWeight:700,textAlign:'right'}}>Paid ₹{Number(q.paid_total).toLocaleString('en-IN')}</div>}
                </div></div>
                <div className="mc-meta">
                  <div className="mc-meta-item">
                    {!isAdmin && (q.project_status||'Unbooked') === 'Booked' ? (
                      <div style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        padding:'4px 10px', borderRadius:20,
                        background:'#F0FDF4', border:'1.5px solid #86EFAC',
                        color:'#15803D', fontWeight:700, fontSize:11,
                        cursor:'not-allowed', userSelect:'none',
                      }} title="Only admins can change a Booked project">
                        ✅ Booked 🔒
                      </div>
                    ) : (
                      <select className={`status-select status-${(q.project_status||'Unbooked').toLowerCase()}`}
                        value={q.project_status||'Unbooked'}
                        onChange={e=>handleStatusChange(q.id,e.target.value)}
                        style={{fontSize:11}}>
                        <option value="Booked">✅ Booked</option>
                        <option value="Unbooked">🔘 Unbooked</option>
                      </select>
                    )}
                  </div>
                  {q.location&&<div className="mc-meta-item">{q.location}</div>}<div className="mc-meta-item">{q.mobile}</div><div className="mc-meta-item">{new Date(q.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div></div>
                <div className="mc-actions">
                  <ActionDropdown
                    q={q}
                    canEdit={canEdit}
                    isManager={isManager}
                    isAdmin={isAdmin}
                    canDelete={canDelete}
                    approvedEdits={approvedEdits}
                    onView={()=>handleView(q.id)}
                    onEdit={()=>handleEdit(q.id)}
                    onRequestEdit={()=>setEditRequestModal(q)}
                    onPayment={()=>handlePayment(q.id)}
                    onDownload={()=>handleDownload(q.id)}
                    onPrint={()=>handlePrint(q.id)}
                    onDelete={()=>handleDelete(q.id)}
                    onProjectMgmt={(isManager||isAdmin) && q.project_status==='Booked' ? ()=>{ setPmProjectId(q.id); setShowProjectMgmt(true); } : null}
                    onVisitReport={()=>setVisitReportQ(q)}
                    onCompletion={()=>setCompletionQ(q)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}