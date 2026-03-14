        {/* Merged Customer Account Modal (Statement + Payments) */}
        {showCustomerAccountModal && (selectedCustomerForPayments || selectedCustomerStatement) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto font-sans" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn("rounded-2xl w-full max-w-4xl shadow-2xl border overflow-hidden max-h-[95vh] overflow-y-auto", isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-white/20")}
            >
              {/* Header with Tabs */}
              <div className={cn("p-6 border-b sticky top-0 z-10", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className={cn("text-2xl font-normal", isDarkMode ? "text-gray-100" : "text-gray-900")}>بيانات الحساب</h3>
                    <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-gray-400" : "text-gray-500")}>
                      {selectedCustomerForPayments?.name || selectedCustomerStatement?.name} - {selectedCustomerForPayments?.phone || selectedCustomerStatement?.phone}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowCustomerAccountModal(false)}
                    className={cn("p-2 rounded-lg transition-colors", isDarkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-black/5 text-gray-400")}
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-t pt-4" style={{ borderColor: isDarkMode ? '#4B5563' : '#e5e7eb' }}>
                  <button
                    onClick={() => setCustomerAccountModalTab('statement')}
                    className={cn("px-4 py-2 rounded-lg font-normal text-sm transition-all", 
                      customerAccountModalTab === 'statement' 
                        ? (isDarkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700")
                        : (isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900")
                    )}
                  >
                    📋 كشف الحساب
                  </button>
                  <button
                    onClick={() => setCustomerAccountModalTab('payments')}
                    className={cn("px-4 py-2 rounded-lg font-normal text-sm transition-all", 
                      customerAccountModalTab === 'payments' 
                        ? (isDarkMode ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700")
                        : (isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900")
                    )}
                  >
                    💳 إدارة التسديدات
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 flex-1 overflow-y-auto">
                {/* STATEMENT TAB */}
                {customerAccountModalTab === 'statement' && (
                  <div className="space-y-6">
                    {/* Credit Info Cards */}
                    <div className={cn("grid grid-cols-3 gap-4")}>
                      <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-blue-900/30" : "bg-blue-50")}>
                        <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-blue-300" : "text-blue-600")}>حد الائتمان</p>
                        <p className={cn("text-lg font-bold", isDarkMode ? "text-blue-400" : "text-blue-700")}>
                          {formatCurrency(selectedCustomerStatement?.credit_limit || 0)}
                        </p>
                      </div>
                      <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-red-900/30" : "bg-red-50")}>
                        <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-red-300" : "text-red-600")}>الديون الحالية</p>
                        <p className={cn("text-lg font-bold", isDarkMode ? "text-red-400" : "text-red-700")}>
                          {formatCurrency(selectedCustomerStatement?.current_debt || 0)}
                        </p>
                      </div>
                      <div className={cn("p-4 rounded-lg", isDarkMode ? "bg-green-900/30" : "bg-green-50")}>
                        <p className={cn("text-xs font-normal mb-1", isDarkMode ? "text-green-300" : "text-green-600")}>الرصيد المتاح</p>
                        <p className={cn("text-lg font-bold", isDarkMode ? "text-green-400" : "text-green-700")}>
                          {formatCurrency((selectedCustomerStatement?.credit_limit || 0) - (selectedCustomerStatement?.current_debt || 0))}
                        </p>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    {isLoadingCustomerTransactions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs md:text-sm">
                          <thead>
                            <tr className={cn("border-b", isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50")}>
                              <th className={cn("px-4 py-2 font-bold text-xs text-left", isDarkMode ? "text-gray-300" : "text-gray-600")}>التاريخ</th>
                              <th className={cn("px-4 py-2 font-bold text-xs text-left", isDarkMode ? "text-gray-300" : "text-gray-600")}>البيان</th>
                              <th className={cn("px-4 py-2 font-bold text-xs text-center", isDarkMode ? "text-red-400" : "text-red-600")}>مدين</th>
                              <th className={cn("px-4 py-2 font-bold text-xs text-center", isDarkMode ? "text-green-400" : "text-green-600")}>دائن</th>
                              <th className={cn("px-4 py-2 font-bold text-xs text-center", isDarkMode ? "text-blue-400" : "text-blue-600")}>الرصيد</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerTransactions.map((tx, idx) => {
                              const balance = Number(tx.balance) || 0;
                              const amount = Number(tx.amount) || 0;
                              const isPayment = tx.is_payment === true;
                              const isDebit = !isPayment && (tx.type === 'topup' || tx.type === 'debit' || tx.type === 'opening');
                              let type = 'معاملة';
                              if (tx.type === 'opening') type = 'ديون سابقة';
                              else if (isPayment) type = '✓ دفعة';
                              else if (tx.type === 'topup') type = 'بطاقة شحن';
                              const debit = (tx.type === 'topup' || isDebit) && amount !== 0 ? Math.abs(amount) : 0;
                              const credit = isPayment && amount !== 0 ? Math.abs(amount) : 0;
                              return (
                                <tr key={idx} className={cn("border-b", isDarkMode ? "border-gray-700" : "border-gray-100")}>
                                  <td className={cn("px-4 py-3 font-normal text-xs", isDarkMode ? "text-gray-300" : "text-gray-700")}>{new Date(tx.created_at || tx.date).toLocaleDateString('ar-IQ')}</td>
                                  <td className={cn("px-4 py-3 font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>{type}</td>
                                  <td className={cn("px-4 py-3 font-bold text-center text-sm", debit > 0 ? (isDarkMode ? "text-red-400" : "text-red-600") : "text-gray-400")}>{debit > 0 ? formatCurrency(debit) : '—'}</td>
                                  <td className={cn("px-4 py-3 font-bold text-center text-sm", credit > 0 ? (isDarkMode ? "text-green-400" : "text-green-600") : "text-gray-400")}>{credit > 0 ? formatCurrency(credit) : '—'}</td>
                                  <td className={cn("px-4 py-3 font-bold text-center text-sm", balance > 0 ? (isDarkMode ? "text-blue-400" : "text-blue-600") : "text-gray-400")}>{formatCurrency(balance)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Manual Payment */}
                    <div className={cn("p-4 border-t rounded-lg", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                      <h4 className={cn("font-normal text-sm mb-4", isDarkMode ? "text-gray-300" : "text-gray-700")}>💳 دفعة يدوية</h4>
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <input type="number" value={merchantPaymentAmount} onChange={(e) => setMerchantPaymentAmount(e.target.value)} placeholder="المبلغ" className={cn("w-full px-4 py-3 border rounded-lg outline-none pl-12", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-100" : "bg-white border-black/5")} />
                          <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-sm", isDarkMode ? "text-gray-400" : "text-gray-500")}>د.أ</span>
                        </div>
                        <button onClick={handleAddMerchantPayment} disabled={isProcessingMerchantPayment || !merchantPaymentAmount} className={cn("px-6 py-3 rounded-lg text-white transition-all flex gap-2", isProcessingMerchantPayment ? "opacity-50 cursor-not-allowed" : "hover:scale-105")} style={{ backgroundColor: primaryColor }}>
                          {isProcessingMerchantPayment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Plus size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYMENTS TAB */}
                {customerAccountModalTab === 'payments' && (
                  <div className="space-y-6">
                    <div className={cn("border rounded-lg overflow-x-auto", isDarkMode ? "border-gray-700" : "border-gray-200")}>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={cn(isDarkMode ? "bg-gray-700" : "bg-gray-100")}>
                            <th className={cn("px-4 py-3 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>المبلغ</th>
                            <th className={cn("px-4 py-3 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>الطريقة</th>
                            <th className={cn("px-4 py-3 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>ملاحظات</th>
                            <th className={cn("px-4 py-3 text-right font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>التاريخ</th>
                            <th className={cn("px-4 py-3 text-center font-normal", isDarkMode ? "text-gray-300" : "text-gray-700")}>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.length === 0 ? (
                            <tr><td colSpan={5} className={cn("px-4 py-8 text-center", isDarkMode ? "text-gray-400" : "text-gray-500")}>لا توجد تسديدات</td></tr>
                          ) : (
                            payments.map((p) => (
                              <tr key={p.id} className={cn("border-t", isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200")}>
                                <td className={cn("px-4 py-3", isDarkMode ? "text-white" : "text-gray-900")}>{Math.round(p.amount)?.toLocaleString()} د.ع</td>
                                <td className={cn("px-4 py-3", isDarkMode ? "text-gray-300" : "text-gray-600")}>{p.payment_method || '—'}</td>
                                <td className={cn("px-4 py-3 text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>{p.notes || '—'}</td>
                                <td className={cn("px-4 py-3 text-xs", isDarkMode ? "text-gray-400" : "text-gray-600")}>{new Date(p.created_at).toLocaleDateString('ar-IQ')}</td>
                                <td className="px-4 py-3 flex gap-2 justify-center">
                                  <button onClick={() => { setPaymentForm({ amount: p.amount.toString(), payment_method: p.payment_method || '', notes: p.notes || '' }); setIsEditingPayment(p.id); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded"><Edit2 size={16} /></button>
                                  <button onClick={() => { if (confirm('تأكيد الحذف؟')) { fetch(`/api/customer-payments/${p.id}`, { method: 'DELETE' }).then(() => setPayments(payments.filter(x => x.id !== p.id))).catch(); } }} className="p-2 text-red-600 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className={cn("p-4 rounded-lg border", isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200")}>
                      <h4 className={cn("font-normal text-sm mb-4", isDarkMode ? "text-white" : "text-gray-900")}>{isEditingPayment ? '✏️ تعديل' : '➕ إضافة'}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="المبلغ" className={cn("px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300")} />
                        <input type="text" value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} placeholder="الطريقة" className={cn("px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300")} />
                        <input type="text" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="ملاحظات" className={cn("px-4 py-3 rounded-lg border", isDarkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300")} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { const a = parseFloat(paymentForm.amount); if (!a || a <= 0) { alert('مبلغ غير صحيح'); return; } fetch(isEditingPayment ? `/api/customer-payments/${isEditingPayment}` : '/api/customer-payments', { method: isEditingPayment ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_id: selectedCustomerForPayments?.customer_id || selectedCustomerForPayments?.id, store_id: user?.store_id, amount: a, payment_method: paymentForm.payment_method, notes: paymentForm.notes }) }).then(r => r.ok ? (setPaymentForm({ amount: '', payment_method: '', notes: '' }), setIsEditingPayment(null), fetch(`/api/customer-payments/${user?.store_id}/${selectedCustomerForPayments?.id}`).then(r => r.json()).then(d => setPayments(Array.isArray(d) ? d : []))) : alert('خطأ')).catch(); }} className="flex-1 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 font-normal transition">
                          {isEditingPayment ? '💾 حفظ' : '➕ إضافة'}
                        </button>
                        {isEditingPayment && (
                          <button onClick={() => { setIsEditingPayment(null); setPaymentForm({ amount: '', payment_method: '', notes: '' }); }} className={cn("flex-1 px-4 py-2 rounded-lg font-normal border", isDarkMode ? "bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200")}>
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={cn("p-4 border-t flex justify-end", isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50/50 border-black/5")}>
                <button onClick={() => setShowCustomerAccountModal(false)} className={cn("px-6 py-2 rounded-lg font-normal transition-all", isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-100" : "bg-gray-200 hover:bg-gray-300 text-gray-700")}>
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
