package config

import (
	"bytes"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/micro/go-micro/client"
)

type platform struct {
	exit chan bool
	opts Options

	sync.RWMutex
	cset *ChangeSet
	vals Values

	idx      int
	watchers map[int]*watcher
}

type watcher struct {
	exit    chan bool
	path    []string
	value   Value
	updates chan Value
}

func newPlatform(opts ...Option) Config {
	options := Options{
		PollInterval: DefaultPollInterval,
		Reader:       NewReader(),
	}

	for _, o := range opts {
		o(&options)
	}

	if options.Client == nil {
		options.Client = client.DefaultClient
	}

	if options.Sources == nil {
		// Set a platform source
		options.Sources = append(options.Sources, NewSource(SourceClient(options.Client)))
	}

	p := &platform{
		exit:     make(chan bool),
		opts:     options,
		watchers: make(map[int]*watcher),
	}

	go p.run()
	return p
}

func (p *platform) run() {
	t := time.NewTicker(p.opts.PollInterval)

	for {
		select {
		case <-t.C:
			p.sync()
		case <-p.exit:
			t.Stop()
			return
		}
	}
}

func (p *platform) loaded() bool {
	var loaded bool
	p.RLock()
	if p.vals != nil {
		loaded = true
	}
	p.RUnlock()
	return loaded
}

func (p *platform) update() {
	var watchers []*watcher

	p.RLock()
	for _, w := range p.watchers {
		watchers = append(watchers, w)
	}
	p.RUnlock()

	for _, w := range watchers {
		select {
		case w.updates <- p.vals.Get(w.path...):
		default:
		}
	}
}

// sync loads all the sources, calls the parser and updates the config
func (p *platform) sync() {
	if len(p.opts.Sources) == 0 {
		log.Printf("Zero sources available to sync")
		return
	}

	var sets []*ChangeSet

	for _, source := range p.opts.Sources {
		ch, err := source.Read()
		// should we actually skip failing sources?
		// best effort merging right? but what if we
		// already have good config? that would be screwed
		if err != nil {
			p.RLock()
			vals := p.vals
			p.RUnlock()

			// if we have no config, we're going to try
			// load something
			if vals == nil {
				log.Printf("Failed to load a source %v but current config is empty so continuing", err)
				continue
			} else {
				log.Printf("Failed to load a source %v backing off", err)
				return
			}
		}
		sets = append(sets, ch)
	}

	set, err := p.opts.Reader.Parse(sets...)
	if err != nil {
		log.Printf("Failed to parse ChangeSets %v", err)
		return
	}

	p.Lock()
	p.vals, _ = p.opts.Reader.Values(set)
	p.cset = set
	p.Unlock()

	p.update()
}

func (p *platform) Close() error {
	select {
	case <-p.exit:
		return nil
	default:
		close(p.exit)
	}
	return nil
}

func (p *platform) Get(path ...string) Value {
	if !p.loaded() {
		p.sync()
	}

	p.Lock()
	defer p.Unlock()

	// did sync actually work?
	if p.vals != nil {
		return p.vals.Get(path...)
	}

	ch := p.cset

	// we are truly screwed, trying to load in a hacked way
	v, err := p.opts.Reader.Values(ch)
	if err != nil {
		log.Printf("Failed to read values %v trying again", err)
		// man we're so screwed
		// Let's try hack this
		// We should really be better
		if ch == nil || ch.Data == nil {
			ch = &ChangeSet{
				Timestamp: time.Now(),
				Source:    p.String(),
				Data:      []byte(`{}`),
			}
		}
		v, _ = p.opts.Reader.Values(ch)
	}

	// lets set it just because
	p.vals = v

	if p.vals != nil {
		return p.vals.Get(path...)
	}

	// ok we're going hardcore now
	return newValue(nil)
}

func (p *platform) Del(path ...string) {
	if !p.loaded() {
		p.sync()
	}

	p.Lock()
	defer p.Unlock()

	if p.vals != nil {
		p.vals.Del(path...)
	}
}

func (p *platform) Set(val interface{}, path ...string) {
	if !p.loaded() {
		p.sync()
	}

	p.Lock()
	defer p.Unlock()

	if p.vals != nil {
		p.vals.Set(val, path...)
	}
}

func (p *platform) Bytes() []byte {
	if !p.loaded() {
		p.sync()
	}

	p.Lock()
	defer p.Unlock()

	if p.vals == nil {
		return []byte{}
	}

	return p.vals.Bytes()
}

func (p *platform) Options() Options {
	return p.opts
}

func (p *platform) String() string {
	return "platform"
}

func (p *platform) Watch(path ...string) (Watcher, error) {
	value := p.Get(path...)

	p.Lock()

	w := &watcher{
		exit:    make(chan bool),
		path:    path,
		value:   value,
		updates: make(chan Value, 1),
	}

	id := p.idx
	p.watchers[id] = w
	p.idx++

	p.Unlock()

	go func() {
		<-w.exit
		p.Lock()
		delete(p.watchers, id)
		p.Unlock()
	}()

	return w, nil
}

func (w *watcher) Next() (Value, error) {
	for {
		select {
		case <-w.exit:
			return nil, errors.New("watcher stopped")
		case v := <-w.updates:
			if bytes.Equal(w.value.Bytes(), v.Bytes()) {
				continue
			}
			w.value = v
			return v, nil
		}
	}
}

func (w *watcher) Stop() error {
	select {
	case <-w.exit:
	default:
		close(w.exit)
	}
	return nil
}
