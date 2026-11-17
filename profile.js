(() => {
 const $=id=>document.getElementById(id);
 const money=n=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(Number(n||0));
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function init(){
  $("year").textContent=new Date().getFullYear();
  if(!window.wbConfigReady){$("profileNotice").innerHTML='<p class="profile-error">Supabase is not configured. Please check supabase-config.js.</p>';return;}
  const {data:{user},error:authError}=await window.wbSupabase.auth.getUser();
  if(authError||!user){$("profileNotice").innerHTML='<h2>Sign in required</h2><p class="muted">Please sign in to your Westbridge Global account to view your profile and orders.</p><a class="primary-button" href="index.html">Go to sign in</a>';return;}
  const {data:profile,error}=await window.wbSupabase.from("profiles").select("id,email,full_name,role,created_at").eq("id",user.id).maybeSingle();
  if(error){$("profileNotice").innerHTML='<p class="profile-error">We could not load your profile. '+esc(error.message)+'</p>';return;}
  $("profileNotice").classList.add("hidden");$("profileContent").classList.remove("hidden");
  $("fullName").value=profile?.full_name||"";$("emailAddress").value=profile?.email||user.email||"";
  $("accountDetails").innerHTML=`Email: ${esc(user.email)}<br>Account type: Customer<br>Member since: ${profile?.created_at?new Date(profile.created_at).toLocaleDateString():"—"}`;
  await loadOrders(user.id);
  $("profileForm").onsubmit=async e=>{e.preventDefault();const msg=$("profileMessage");msg.textContent="Saving…";msg.classList.remove("success");const full_name=$("fullName").value.trim();if(!full_name){msg.textContent="Please enter your full name.";return;}const {error:updateError}=await window.wbSupabase.from("profiles").update({full_name}).eq("id",user.id);if(updateError){msg.textContent=updateError.message;return;}msg.textContent="Profile updated successfully.";msg.classList.add("success");};
  $("profileSignOut").onclick=async()=>{await window.wbSupabase.auth.signOut();location.href="index.html";};
 }
 async function loadOrders(userId){const box=$("orderList");const {data:orders,error}=await window.wbSupabase.from("orders").select("id,total_amount,currency,status,created_at").eq("customer_id",userId).order("created_at",{ascending:false}).limit(50);if(error){box.innerHTML=`<p class="profile-error">Could not load orders: ${esc(error.message)}</p>`;return;}if(!orders?.length){box.innerHTML='<div class="profile-empty">You have not placed any orders yet. Your order history will appear here.</div>';return;}box.innerHTML=orders.map(o=>`<article class="profile-order"><div><b>Order #${esc(o.id.slice(0,8).toUpperCase())}</b><small>${new Date(o.created_at).toLocaleString()} · ${money(o.total_amount)}</small></div><span class="profile-status">${esc(o.status)}</span></article>`).join("");}
 document.addEventListener("DOMContentLoaded",init);
})();
